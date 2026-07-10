"""
Campus Connect ERP — Retest Marks API

Faculty-facing endpoints (under /api/retest):
  GET  /api/retest/courses/{assignment_id}/eligible?grade_type=internal_1
       → Lists students who failed or were absent in that assessment.
         Only works once the original grades are published.

  POST /api/retest/courses/{assignment_id}/save
       → Bulk upsert retest marks for eligible students (draft, not published).
         payload: { grade_type, entries: [{ student_id, marks_obtained, remarks }] }

  POST /api/retest/courses/{assignment_id}/publish
       → Publishes all saved retest marks for a grade_type.
         payload: { grade_type }
         After this, each student can see ONLY their own mark.

Student-facing endpoint (under /api/retest):
  GET  /api/retest/my-marks
       → Returns the logged-in student's own published retest marks across all courses.

Access rules:
  - Faculty can only manage retest marks for course assignments they own.
  - Students can only read their own marks, and only after is_published=True.
  - A retest entry can only be created when the original Grade is published
    AND (is_absent=True OR marks_obtained < pass_mark).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.academic import CourseAssignment
from app.models.grade import Grade, GradeType, GRADE_MAX_MARKS, GRADE_PASS_MARKS
from app.models.retest import RetestMark

router = APIRouter()


# ─────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────

def _require_faculty(current_user: User, db: Session) -> Faculty:
    if current_user.role not in ["faculty", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty can manage retest marks"
        )
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return faculty


def _get_assignment(assignment_id: int, faculty: Faculty, db: Session) -> CourseAssignment:
    assignment = (
        db.query(CourseAssignment)
        .options(
            joinedload(CourseAssignment.course),
            joinedload(CourseAssignment.section),
        )
        .filter(
            CourseAssignment.id == assignment_id,
            CourseAssignment.faculty_id == faculty.id,
            CourseAssignment.is_active == True,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Course assignment not found")
    return assignment


def _parse_grade_type(raw: str) -> GradeType:
    try:
        return GradeType(raw)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid grade_type '{raw}'. Must be one of: "
                   + ", ".join(g.value for g in GradeType)
        )


def _is_retest_eligible(grade: Grade, pass_mark) -> bool:
    """True when the student failed or was absent in the original assessment."""
    if grade.is_absent:
        return True
    if pass_mark is not None and grade.marks_obtained is not None:
        return float(grade.marks_obtained) < pass_mark
    return False


# ─────────────────────────────────────────────────────────
# 1. GET eligible students for retest
# ─────────────────────────────────────────────────────────

@router.get("/courses/{assignment_id}/eligible")
def get_eligible_students(
    assignment_id: int,
    grade_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns students who are eligible for retest in the given assessment:
      - The original grades must be published first.
      - Eligible = absent OR marks < pass_mark.
    Also shows whether a retest mark has already been saved/published for each.
    """
    faculty = _require_faculty(current_user, db)
    assignment = _get_assignment(assignment_id, faculty, db)
    gt = _parse_grade_type(grade_type)

    pass_mark = GRADE_PASS_MARKS.get(gt)
    if pass_mark is None:
        raise HTTPException(
            status_code=400,
            detail=f"Retest is only applicable to assessments with a pass mark: "
                   + ", ".join(k.value for k in GRADE_PASS_MARKS)
        )

    max_marks = GRADE_MAX_MARKS.get(gt, 100)

    # All published grades for this course + grade_type
    published_grades = (
        db.query(Grade)
        .filter(
            Grade.course_id == assignment.course_id,
            Grade.grade_type == gt.value,
            Grade.academic_year == assignment.academic_year,
            Grade.semester == assignment.semester,
            Grade.is_published == True,
        )
        .all()
    )

    if not published_grades:
        raise HTTPException(
            status_code=400,
            detail="Original grades must be published before adding retest marks."
        )

    # Filter only eligible
    eligible_grade_ids = [g.id for g in published_grades if _is_retest_eligible(g, pass_mark)]

    if not eligible_grade_ids:
        return {
            "course_name": assignment.course.name,
            "course_code": assignment.course.code,
            "grade_type": gt.value,
            "pass_mark": pass_mark,
            "max_marks": max_marks,
            "eligible_students": [],
        }

    # Fetch student details for eligible grades
    grade_map = {g.id: g for g in published_grades if g.id in eligible_grade_ids}
    student_ids = [g.student_id for g in grade_map.values()]

    students = (
        db.query(Student)
        .filter(Student.id.in_(student_ids))
        .all()
    )
    student_map = {s.id: s for s in students}

    # Existing retest marks (keyed by grade_id)
    existing_retests = (
        db.query(RetestMark)
        .filter(RetestMark.grade_id.in_(eligible_grade_ids))
        .all()
    )
    retest_map = {r.grade_id: r for r in existing_retests}

    roster = []
    for grade in grade_map.values():
        s = student_map.get(grade.student_id)
        if not s:
            continue
        rt = retest_map.get(grade.id)
        roster.append({
            "student_id": s.id,
            "register_number": s.register_number,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "original_marks": float(grade.marks_obtained) if grade.marks_obtained is not None else None,
            "original_absent": grade.is_absent,
            "grade_id": grade.id,
            # Retest info (None if not yet entered)
            "retest_id": rt.id if rt else None,
            "retest_marks": float(rt.marks_obtained) if rt and rt.marks_obtained is not None else None,
            "retest_remarks": rt.remarks if rt else "",
            "retest_published": rt.is_published if rt else False,
        })

    # Sort by register number for consistent display
    roster.sort(key=lambda x: x["register_number"])

    return {
        "course_name": assignment.course.name,
        "course_code": assignment.course.code,
        "section": (
            f"{assignment.section.year} Year {assignment.section.name}"
            if assignment.section else ""
        ),
        "academic_year": assignment.academic_year,
        "semester": assignment.semester,
        "grade_type": gt.value,
        "pass_mark": pass_mark,
        "max_marks": max_marks,
        "eligible_students": roster,
    }


# ─────────────────────────────────────────────────────────
# 2. POST save (bulk upsert) retest marks — draft
# ─────────────────────────────────────────────────────────

@router.post("/courses/{assignment_id}/save")
def save_retest_marks(
    assignment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Bulk upsert retest marks for eligible students.
    Marks are saved as draft (is_published=False) until explicitly published.

    payload: {
        "grade_type": "internal_1",
        "entries": [
            { "student_id": 1, "grade_id": 5, "marks_obtained": 30, "remarks": "" },
            ...
        ]
    }
    - grade_id must correspond to a published, failed/absent grade owned by this course.
    - marks_obtained is optional (null = absent in retest).
    - Already-published retest entries cannot be overwritten.
    """
    faculty = _require_faculty(current_user, db)
    assignment = _get_assignment(assignment_id, faculty, db)
    gt = _parse_grade_type(payload.get("grade_type", ""))

    pass_mark = GRADE_PASS_MARKS.get(gt)
    if pass_mark is None:
        raise HTTPException(
            status_code=400,
            detail="Retest marks can only be entered for assessments with a pass mark."
        )

    max_marks = float(GRADE_MAX_MARKS.get(gt, 100))
    entries = payload.get("entries", [])
    if not entries:
        raise HTTPException(status_code=400, detail="No entries provided.")

    saved = 0
    skipped = []

    for entry in entries:
        student_id = entry.get("student_id")
        grade_id = entry.get("grade_id")
        raw_marks = entry.get("marks_obtained")
        remarks = entry.get("remarks", "") or ""

        if not student_id or not grade_id:
            skipped.append(f"student_id={student_id}: missing grade_id")
            continue

        # Validate the original grade belongs to this course and is eligible
        original_grade = db.query(Grade).filter(
            Grade.id == grade_id,
            Grade.student_id == student_id,
            Grade.course_id == assignment.course_id,
            Grade.grade_type == gt.value,
            Grade.academic_year == assignment.academic_year,
            Grade.semester == assignment.semester,
            Grade.is_published == True,
        ).first()

        if not original_grade:
            skipped.append(
                f"student_id={student_id}: original published grade not found"
            )
            continue

        if not _is_retest_eligible(original_grade, pass_mark):
            skipped.append(
                f"student_id={student_id}: not eligible for retest (passed original)"
            )
            continue

        # Validate marks value
        marks = None
        if raw_marks is not None:
            try:
                marks = float(raw_marks)
                if marks < 0 or marks > max_marks:
                    skipped.append(
                        f"student_id={student_id}: marks {marks} out of range (0–{max_marks})"
                    )
                    continue
            except (TypeError, ValueError):
                skipped.append(f"student_id={student_id}: invalid marks value")
                continue

        # Upsert
        existing = db.query(RetestMark).filter(
            RetestMark.grade_id == grade_id,
            RetestMark.student_id == student_id,
        ).first()

        if existing:
            existing.marks_obtained = marks
            existing.max_marks = max_marks
            existing.remarks = remarks
            existing.entered_by_id = faculty.id
        else:
            db.add(RetestMark(
                grade_id=grade_id,
                student_id=student_id,
                course_id=assignment.course_id,
                marks_obtained=marks,
                max_marks=max_marks,
                entered_by_id=faculty.id,
                remarks=remarks,
                is_published=False,
            ))

        saved += 1

    db.commit()
    return {
        "message": f"Saved {saved} retest mark(s).",
        "saved": saved,
        "skipped": skipped,
    }


# ─────────────────────────────────────────────────────────
# 3. POST publish retest marks
# ─────────────────────────────────────────────────────────

@router.post("/courses/{assignment_id}/publish")
def publish_retest_marks(
    assignment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Publishes all saved (draft) retest marks for a given grade_type.
    Once published, each student can see ONLY their own retest mark.

    payload: { "grade_type": "internal_1" }
    """
    faculty = _require_faculty(current_user, db)
    assignment = _get_assignment(assignment_id, faculty, db)
    gt = _parse_grade_type(payload.get("grade_type", ""))

    # Find all retest marks for this course + grade_type (published or not)
    retests = (
        db.query(RetestMark)
        .join(Grade, RetestMark.grade_id == Grade.id)
        .filter(
            RetestMark.course_id == assignment.course_id,
            Grade.grade_type == gt.value,
            Grade.academic_year == assignment.academic_year,
            Grade.semester == assignment.semester,
        )
        .all()
    )

    if not retests:
        raise HTTPException(
            status_code=404,
            detail="No retest marks found for this assessment."
        )

    # Only publish entries that are not yet published (new students)
    to_publish = [rt for rt in retests if not rt.is_published]
    if not to_publish:
        raise HTTPException(
            status_code=400,
            detail="No new retest marks to publish. All entries are already published."
        )

    for rt in to_publish:
        rt.is_published = True

    db.commit()
    return {
        "message": f"Published {len(retests)} retest mark(s) for {gt.value}.",
        "published": len(retests),
    }


# ─────────────────────────────────────────────────────────
# 4. Student: view own published retest marks
# ─────────────────────────────────────────────────────────

@router.get("/my-marks")
def get_my_retest_marks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the logged-in student's own published retest marks across all courses.
    Students CANNOT see other students' marks — this endpoint is scoped to self only.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint."
        )

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    retests = (
        db.query(RetestMark)
        .options(
            joinedload(RetestMark.course),
            joinedload(RetestMark.grade),
        )
        .filter(
            RetestMark.student_id == student.id,
            RetestMark.is_published == True,
        )
        .all()
    )

    return [
        {
            "retest_id": rt.id,
            "course_id": rt.course_id,
            "course_name": rt.course.name if rt.course else None,
            "course_code": rt.course.code if rt.course else None,
            "grade_type": rt.grade.grade_type.value if rt.grade and rt.grade.grade_type else None,
            "original_marks": (
                float(rt.grade.marks_obtained)
                if rt.grade and rt.grade.marks_obtained is not None
                else None
            ),
            "original_absent": rt.grade.is_absent if rt.grade else None,
            "retest_marks": float(rt.marks_obtained) if rt.marks_obtained is not None else None,
            "max_marks": float(rt.max_marks),
            "remarks": rt.remarks,
        }
        for rt in retests
    ]


# ─────────────────────────────────────────────────────────
# 5. Student: view own published grades for a course
# ─────────────────────────────────────────────────────────

@router.get("/my-grades/{course_id}")
def get_my_grades_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the logged-in student's own published grades for a specific course.
    Only published grades are returned — students cannot see draft or other students' marks.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint."
        )

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    from app.models.grade import Grade as GradeModel

    grades = (
        db.query(GradeModel)
        .filter(
            GradeModel.student_id == student.id,
            GradeModel.course_id == course_id,
            GradeModel.is_published == True,
        )
        .all()
    )

    # Fetch specific assignment grades
    from app.models.grade import AssignmentGrade, Seminar
    from app.models.lms import LMSResource
    from app.models.academic import CourseAssignment

    assignment_grades = (
        db.query(AssignmentGrade)
        .join(LMSResource, LMSResource.id == AssignmentGrade.assignment_id)
        .filter(
            AssignmentGrade.student_id == student.id,
            LMSResource.course_id == course_id,
            AssignmentGrade.is_published == True,
        )
        .all()
    )

    seminar_grades = (
        db.query(Seminar)
        .join(CourseAssignment, CourseAssignment.id == Seminar.course_assignment_id)
        .filter(
            Seminar.student_id == student.id,
            CourseAssignment.course_id == course_id,
            Seminar.is_marks_published == True,
        )
        .all()
    )

    formatted = [
        {
            "grade_type": g.grade_type.value if g.grade_type else None,
            "marks_obtained": float(g.marks_obtained) if g.marks_obtained is not None else None,
            "max_marks": float(GRADE_MAX_MARKS.get(g.grade_type)) if g.grade_type in GRADE_MAX_MARKS else float(g.max_marks),
            "is_absent": g.is_absent,
            "remarks": g.remarks,
        }
        for g in grades
    ]

    # Format specific assignment grades
    for ag in assignment_grades:
        formatted.append({
            "grade_type": "assignment",
            "assignment_title": ag.assignment.title,
            "marks_obtained": float(ag.marks_obtained) if ag.marks_obtained is not None else None,
            "max_marks": float(ag.max_marks),
            "is_absent": ag.is_absent,
            "remarks": ag.remarks,
        })

    # Format seminar grades
    for sg in seminar_grades:
        formatted.append({
            "grade_type": "seminar",
            "assignment_title": f"Seminar: {sg.seminar_topic}" if sg.seminar_topic else "Seminar",
            "marks_obtained": float(sg.marks_obtained) if sg.marks_obtained is not None else None,
            "max_marks": float(sg.max_marks),
            "is_absent": False,
            "remarks": f"Seminar Date: {sg.seminar_date.strftime('%Y-%m-%d')}" if sg.seminar_date else None,
        })

    return formatted
