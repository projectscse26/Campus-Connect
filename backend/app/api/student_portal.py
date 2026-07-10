"""
Campus Connect ERP — Student Portal API

Read-only endpoints for the Student Portal.
All endpoints are scoped to the currently authenticated student.

Endpoints:
  GET /api/student-portal/me                                    - Student profile
  GET /api/student-portal/courses                               - Enrolled courses for current semester
  GET /api/student-portal/courses/{course_id}/resources         - LMS resources (non-assignment)
  GET /api/student-portal/courses/{course_id}/assignments       - LMS resources of type 'assignment'
  GET /api/student-portal/courses/{course_id}/announcements     - Course announcements
  GET /api/student-portal/courses/{course_id}/syllabus          - LMS resources of type 'syllabus'
  GET /api/student-portal/courses/{course_id}/attendance        - Attendance summary for the student
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.models.academic import Course, CourseAssignment, Enrollment, Section, MentorAssignment
from app.models.lms import LMSResource, Announcement
from app.models.attendance import Attendance
from app.models.faculty import Faculty
from app.models.department import Department
from app.models.leave import StudentLeaveRequest, StudentLeaveStatus
from app.models.grade import Seminar
from app.schemas.leave import StudentLeaveRequestCreate, StudentLeaveRequestResponse

router = APIRouter()


# ─────────────────────────────────────────────────────────
# HELPER: Resolve current student from logged-in user
# ─────────────────────────────────────────────────────────

def get_student_profile(current_user: User, db: Session) -> Student:
    """
    Given the current authenticated user (who must have role='student'),
    return their Student profile record.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to students"
        )
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.id)
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user"
        )
    return student


def verify_course_enrollment(student: Student, course_id: int, db: Session) -> Course:
    """
    Verifies that the given student is actually enrolled in the requested course.
    Raises 403 Forbidden if not.
    """
    # First check explicit enrollment (if used in future)
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student.id,
            Enrollment.course_id == course_id
        )
        .first()
    )
    if enrollment and enrollment.course:
        return enrollment.course
        
    # Check implicit enrollment via section assignment
    if student.section_id:
        assignment = (
            db.query(CourseAssignment)
            .options(joinedload(CourseAssignment.course))
            .filter(
                CourseAssignment.section_id == student.section_id,
                CourseAssignment.course_id == course_id,
                CourseAssignment.is_active == True
            )
            .first()
        )
        if assignment and assignment.course:
            return assignment.course

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not enrolled in this course."
    )


# ─────────────────────────────────────────────────────────
# 1. Student Profile
# ─────────────────────────────────────────────────────────

@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the logged-in student's profile:
    name, register number, semester, department, section, batch.
    """
    student = get_student_profile(current_user, db)

    dept = db.query(Department).filter(Department.id == student.department_id).first()
    section_name = None
    if student.section:
        section_name = student.section.name

    return {
        "id": student.id,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "register_number": student.register_number,
        "college_email": student.college_email,
        "current_semester": student.current_semester,
        "current_year": student.current_year,
        "batch": student.batch,
        "department": {
            "id": dept.id,
            "name": dept.name,
            "code": dept.code
        } if dept else None,
        "section": section_name,
    }


# ─────────────────────────────────────────────────────────
# 2. Enrolled Courses (for current semester)
# ─────────────────────────────────────────────────────────

@router.get("/courses")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns courses the student is enrolled in for their current semester.

    For each course, also includes the faculty member assigned to teach
    this course to the student's section (via CourseAssignment).
    """
    student = get_student_profile(current_user, db)

    # Fetch explicit enrollments (if any)
    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.course))
        .filter(
            Enrollment.student_id == student.id,
            Enrollment.semester == student.current_semester
        )
        .all()
    )

    course_map = {}  # course_id -> (course, faculty_name, enrollment_id)
    
    for enrollment in enrollments:
        if enrollment.course and enrollment.course.is_active:
            course_map[enrollment.course_id] = (enrollment.course, None, enrollment.id)

    # Fetch implicit enrollments via section assignments
    if student.section_id:
        assignments = (
            db.query(CourseAssignment)
            .options(joinedload(CourseAssignment.course), joinedload(CourseAssignment.faculty))
            .filter(
                CourseAssignment.section_id == student.section_id,
                CourseAssignment.semester == student.current_semester,
                CourseAssignment.is_active == True
            )
            .all()
        )
        for assignment in assignments:
            if assignment.course and assignment.course.is_active:
                f_name = None
                if assignment.faculty:
                    f = assignment.faculty
                    f_name = f"{f.first_name} {f.last_name}"
                if assignment.course_id not in course_map:
                    # Fake enrollment_id with course.id just to fulfill the API requirement
                    course_map[assignment.course_id] = (assignment.course, f_name, assignment.course.id)
                elif course_map[assignment.course_id][1] is None and f_name:
                    course_map[assignment.course_id] = (assignment.course, f_name, course_map[assignment.course_id][2])

    result = []
    for course_id, (course, faculty_name, enrollment_id) in course_map.items():
        # Resolve department name
        dept = db.query(Department).filter(Department.id == course.department_id).first()
        dept_name = dept.name if dept else None

        # Resolve faculty if still not found
        if faculty_name is None:
            # Find faculty assigned to this course for the student's section
            if student.section_id:
                assignment = (
                    db.query(CourseAssignment)
                    .options(joinedload(CourseAssignment.faculty))
                    .filter(
                        CourseAssignment.course_id == course.id,
                        CourseAssignment.section_id == student.section_id,
                        CourseAssignment.is_active == True
                    )
                    .first()
                )
                if assignment and assignment.faculty:
                    f = assignment.faculty
                    faculty_name = f"{f.first_name} {f.last_name}"
            
            # If section-specific faculty not found, fall back to any active assignment for this course
            if not faculty_name:
                any_assignment = (
                    db.query(CourseAssignment)
                    .options(joinedload(CourseAssignment.faculty))
                    .filter(
                        CourseAssignment.course_id == course.id,
                        CourseAssignment.is_active == True
                    )
                    .first()
                )
                if any_assignment and any_assignment.faculty:
                    f = any_assignment.faculty
                    faculty_name = f"{f.first_name} {f.last_name}"

        result.append({
            "id": course.id,
            "code": course.code,
            "name": course.name,
            "credits": course.credits,
            "course_type": course.course_type.value if course.course_type else None,
            "semester": course.semester,
            "department": dept_name,
            "faculty_name": faculty_name,
            "enrollment_id": enrollment_id,
        })

    return result


# ─────────────────────────────────────────────────────────
# 3. Course Resources (non-assignment, non-syllabus)
# ─────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/resources")
def get_course_resources(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns learning materials for a course: notes, reference materials, videos.
    Excludes 'assignment' and 'syllabus' types (handled by separate endpoints).
    Students have read-only access.
    """
    student = get_student_profile(current_user, db)
    verify_course_enrollment(student, course_id, db)

    resources = (
        db.query(LMSResource)
        .options(joinedload(LMSResource.uploaded_by))
        .filter(
            LMSResource.course_id == course_id,
            LMSResource.resource_type.in_(["notes", "reference", "video"])
        )
        .order_by(LMSResource.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "resource_type": r.resource_type.value if r.resource_type else None,
            "file_url": r.file_url,
            "external_link": r.external_link,
            "uploaded_by": f"{r.uploaded_by.first_name} {r.uploaded_by.last_name}" if r.uploaded_by else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resources
    ]


# ─────────────────────────────────────────────────────────
# 4. Course Assignments
# ─────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/assignments")
def get_course_assignments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns assignments posted by faculty for this course.
    Uses LMSResource records of type 'assignment'.
    Students have read-only access.
    """
    student = get_student_profile(current_user, db)
    verify_course_enrollment(student, course_id, db)

    assignments = (
        db.query(LMSResource)
        .options(joinedload(LMSResource.uploaded_by))
        .filter(
            LMSResource.course_id == course_id,
            LMSResource.resource_type == "assignment"
        )
        .order_by(LMSResource.created_at.desc())
        .all()
    )

    # Fetch published assignment grades for this student
    from app.models.grade import AssignmentGrade
    grades = (
        db.query(AssignmentGrade)
        .filter(
            AssignmentGrade.student_id == student.id,
            AssignmentGrade.is_published == True
        )
        .all()
    )
    grade_map = {g.assignment_id: g for g in grades}

    result = []
    for a in assignments:
        grade = grade_map.get(a.id)

        # Parse due date from description if possible
        import re
        due_match = re.search(r"\[Due:\s*(.+?)\]", a.description or "")
        due_date_str = due_match.group(1) if due_match else None

        # Clean description by removing the due date header
        clean_desc = a.description
        if clean_desc and due_date_str:
            clean_desc = re.sub(r"\[Due:\s*(.+?)\]\n?", "", clean_desc)

        result.append({
            "id": a.id,
            "title": a.title,
            "description": clean_desc,
            "file_url": a.file_url,
            "external_link": a.external_link,
            "uploaded_by": f"{a.uploaded_by.first_name} {a.uploaded_by.last_name}" if a.uploaded_by else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "due_date": due_date_str,
            "grade": {
                "marks_obtained": float(grade.marks_obtained) if grade.marks_obtained is not None else None,
                "max_marks": float(grade.max_marks),
                "is_absent": grade.is_absent,
                "remarks": grade.remarks,
            } if grade else None
        })
    return result


# ─────────────────────────────────────────────────────────
# 5. Course Announcements
# ─────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/announcements")
def get_course_announcements(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns announcements posted for this specific course.
    Only announcements with course_id matching are returned.
    Students have read-only access.
    """
    student = get_student_profile(current_user, db)
    verify_course_enrollment(student, course_id, db)

    announcements = (
        db.query(Announcement)
        .options(joinedload(Announcement.posted_by))
        .filter(Announcement.course_id == course_id)
        .order_by(Announcement.created_at.desc())
        .all()
    )

    return [
        {
            "id": ann.id,
            "title": ann.title,
            "content": ann.content,
            "posted_by": ann.posted_by.email.split("@")[0] if ann.posted_by else None,
            "created_at": ann.created_at.isoformat() if ann.created_at else None,
        }
        for ann in announcements
    ]


# ─────────────────────────────────────────────────────────
# 6. Course Syllabus
# ─────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/syllabus")
def get_course_syllabus(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns syllabus resources uploaded by faculty for this course.
    Uses LMSResource records of type 'syllabus'.
    Students have read-only access.
    """
    student = get_student_profile(current_user, db)
    verify_course_enrollment(student, course_id, db)

    syllabus_items = (
        db.query(LMSResource)
        .options(joinedload(LMSResource.uploaded_by))
        .filter(
            LMSResource.course_id == course_id,
            LMSResource.resource_type == "syllabus"
        )
        .order_by(LMSResource.created_at.desc())
        .all()
    )

    return [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "file_url": s.file_url,
            "external_link": s.external_link,
            "uploaded_by": f"{s.uploaded_by.first_name} {s.uploaded_by.last_name}" if s.uploaded_by else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in syllabus_items
    ]


# ─────────────────────────────────────────────────────────
# 7. Attendance History
# ─────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/attendance")
def get_course_attendance(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns full attendance history for the logged-in student in the given course.
    Includes per-record details and a summary (total, attended, percentage).
    """
    student = get_student_profile(current_user, db)
    verify_course_enrollment(student, course_id, db)

    records = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student.id,
            Attendance.course_id == course_id
        )
        .order_by(Attendance.date.desc())
        .all()
    )

    total_classes = len(records)
    attended = sum(1 for r in records if r.status.value in ("present", "on_duty"))
    percentage = round((attended / total_classes * 100), 1) if total_classes > 0 else 0.0

    history = [
        {
            "id": r.id,
            "date": r.date.isoformat() if r.date else None,
            "hour": r.hour,
            "status": r.status.value if r.status else None,
        }
        for r in records
    ]

    return {
        "course_id": course_id,
        "student_id": student.id,
        "summary": {
            "total_classes": total_classes,
            "classes_attended": attended,
            "attendance_percentage": percentage,
        },
        "history": history,
    }


# ─────────────────────────────────────────────────────────
# HELPER: serialise a StudentLeaveRequest into the response dict
# ─────────────────────────────────────────────────────────

def _faculty_name(fac):
    if fac is None:
        return None
    return f"{fac.first_name} {fac.last_name}"


def _format_leave(req: StudentLeaveRequest) -> dict:
    return {
        "id":                        req.id,
        "student_id":                req.student_id,
        "from_date":                 req.from_date.isoformat(),
        "to_date":                   req.to_date.isoformat(),
        "duration_days":             req.duration_days,
        "reason":                    req.reason,
        "status":                    req.status.value,
        # Mentor (step 1)
        "mentor_id":                 req.mentor_id,
        "mentor_name":               _faculty_name(req.mentor),
        "mentor_remarks":            req.mentor_remarks,
        "mentor_actioned_at":        req.mentor_actioned_at.isoformat() if req.mentor_actioned_at else None,
        # Class Advisor (step 2)
        "class_advisor_id":          req.class_advisor_id,
        "class_advisor_name":        _faculty_name(req.class_advisor),
        "class_advisor_remarks":     req.class_advisor_remarks,
        "class_advisor_actioned_at": req.class_advisor_actioned_at.isoformat() if req.class_advisor_actioned_at else None,
        # HOD (step 3)
        "hod_id":                    req.hod_id,
        "hod_name":                  _faculty_name(req.hod),
        "hod_remarks":               req.hod_remarks,
        "hod_actioned_at":           req.hod_actioned_at.isoformat() if req.hod_actioned_at else None,
        "rejection_reason":          req.rejection_reason,
        "viewed_by_mentor":          req.viewed_by_mentor,
        "viewed_by_ca":              req.viewed_by_ca,
        "viewed_by_hod":             req.viewed_by_hod,
        "created_at":                req.created_at.isoformat() if req.created_at else None,
        "updated_at":                req.updated_at.isoformat() if req.updated_at else None,
    }

def _leave_with_student(r: StudentLeaveRequest) -> dict:
    d = _format_leave(r)
    s = r.student
    d["student_name"]    = f"{s.first_name} {s.last_name}" if s else None
    d["register_number"] = s.register_number if s else None
    return d

def _load_leave(leave_id: int, db: Session) -> StudentLeaveRequest:
    return (
        db.query(StudentLeaveRequest)
        .options(
            joinedload(StudentLeaveRequest.student),
            joinedload(StudentLeaveRequest.mentor),
            joinedload(StudentLeaveRequest.class_advisor),
            joinedload(StudentLeaveRequest.hod),
        )
        .filter(StudentLeaveRequest.id == leave_id)
        .first()
    )


# ─────────────────────────────────────────────────────────
# 8. Student Leave — Apply
#    Workflow: Student → Mentor → Class Advisor → HOD
# ─────────────────────────────────────────────────────────

@router.post("/leave")
def apply_leave(
    payload: StudentLeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student = get_student_profile(current_user, db)

    if payload.to_date < payload.from_date:
        raise HTTPException(status_code=400, detail="to_date must be on or after from_date")

    duration = (payload.to_date - payload.from_date).days + 1

    # Resolve mentor
    mentor_id = None
    ma = db.query(MentorAssignment).filter(MentorAssignment.student_id == student.id).first()
    if ma:
        mentor_id = ma.mentor_id

    # Resolve class advisor from section
    class_advisor_id = None
    if student.section_id:
        section = db.query(Section).filter(Section.id == student.section_id).first()
        if section:
            class_advisor_id = section.class_advisor_id

    leave = StudentLeaveRequest(
        student_id=student.id,
        from_date=payload.from_date,
        to_date=payload.to_date,
        duration_days=duration,
        reason=payload.reason,
        status=StudentLeaveStatus.PENDING_MENTOR,
        mentor_id=mentor_id,
        class_advisor_id=class_advisor_id,  # snapshot, refreshed on mentor approval
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    return _format_leave(_load_leave(leave.id, db))


# ─────────────────────────────────────────────────────────
# 9. Student Leave — List my requests
# ─────────────────────────────────────────────────────────

@router.get("/leave")
def get_my_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student = get_student_profile(current_user, db)

    requests = (
        db.query(StudentLeaveRequest)
        .options(
            joinedload(StudentLeaveRequest.mentor),
            joinedload(StudentLeaveRequest.class_advisor),
            joinedload(StudentLeaveRequest.hod),
        )
        .filter(StudentLeaveRequest.student_id == student.id)
        .order_by(StudentLeaveRequest.created_at.desc())
        .all()
    )
    return [_format_leave(r) for r in requests]


# ─────────────────────────────────────────────────────────
# 10. Student Leave — Withdraw
# ─────────────────────────────────────────────────────────

@router.delete("/leave/{leave_id}")
def withdraw_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    student = get_student_profile(current_user, db)

    leave = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.id == leave_id,
        StudentLeaveRequest.student_id == student.id,
    ).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status not in (
        StudentLeaveStatus.PENDING_MENTOR,
        StudentLeaveStatus.PENDING_CLASS_ADVISOR,
        StudentLeaveStatus.PENDING_HOD,
    ):
        raise HTTPException(status_code=400, detail="Only pending requests can be withdrawn")

    leave.status = StudentLeaveStatus.WITHDRAWN
    db.commit()
    return {"message": "Leave request withdrawn successfully"}


# ─────────────────────────────────────────────────────────
# 11. Mentor — Pending queue
#     Uses the student's CURRENT mentor assignment, not the stored snapshot
# ─────────────────────────────────────────────────────────

@router.get("/leave/mentor-queue")
def get_mentor_leave_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    # Get all students currently assigned to this mentor
    mentored_student_ids = [
        ma.student_id for ma in db.query(MentorAssignment)
        .filter(MentorAssignment.mentor_id == faculty.id)
        .all()
    ]

    if not mentored_student_ids:
        return []

    requests = (
        db.query(StudentLeaveRequest)
        .options(
            joinedload(StudentLeaveRequest.student),
            joinedload(StudentLeaveRequest.mentor),
            joinedload(StudentLeaveRequest.class_advisor),
            joinedload(StudentLeaveRequest.hod),
        )
        .filter(
            StudentLeaveRequest.student_id.in_(mentored_student_ids),
            StudentLeaveRequest.status == StudentLeaveStatus.PENDING_MENTOR,
        )
        .order_by(StudentLeaveRequest.created_at.desc())
        .all()
    )
    return [_leave_with_student(r) for r in requests]


# ─────────────────────────────────────────────────────────
# 12. Mentor — Approve / Reject  →  next: PENDING_CLASS_ADVISOR
#     Validates faculty is the student's current mentor
# ─────────────────────────────────────────────────────────

@router.put("/leave/{leave_id}/mentor-action")
def mentor_action(
    leave_id: int,
    action: str,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    # Validate this faculty is the student's current mentor
    mentored_student_ids = [
        ma.student_id for ma in db.query(MentorAssignment)
        .filter(MentorAssignment.mentor_id == faculty.id)
        .all()
    ]

    leave = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.id == leave_id,
        StudentLeaveRequest.student_id.in_(mentored_student_ids),
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found or you are not this student's mentor")
    if leave.status != StudentLeaveStatus.PENDING_MENTOR:
        raise HTTPException(status_code=400, detail="Request is not pending mentor action")

    leave.mentor_id = faculty.id   # stamp current mentor
    leave.mentor_remarks = remarks
    leave.mentor_actioned_at = datetime.utcnow()

    if action.lower() == "approve":
        # Resolve current class advisor for next step
        student = db.query(Student).filter(Student.id == leave.student_id).first()
        if student and student.section_id:
            section = db.query(Section).filter(Section.id == student.section_id).first()
            if section and section.class_advisor_id:
                leave.class_advisor_id = section.class_advisor_id
        leave.status = StudentLeaveStatus.PENDING_CLASS_ADVISOR
    elif action.lower() == "reject":
        leave.status = StudentLeaveStatus.REJECTED
        leave.rejection_reason = remarks or "Rejected by mentor"
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    db.commit()
    return _format_leave(_load_leave(leave.id, db))


# ─────────────────────────────────────────────────────────
# 13. Class Advisor — Pending queue
#     Uses the student's CURRENT section class_advisor, not the stored snapshot
# ─────────────────────────────────────────────────────────

@router.get("/leave/ca-queue")
def get_ca_leave_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    # Get all sections this faculty advises
    advised_sections = db.query(Section).filter(
        Section.class_advisor_id == faculty.id,
        Section.is_active == True,
    ).all()
    advised_section_ids = [s.id for s in advised_sections]

    if not advised_section_ids:
        return []

    # Get all students in those sections
    student_ids = [
        s.id for s in db.query(Student.id)
        .filter(Student.section_id.in_(advised_section_ids))
        .all()
    ]

    if not student_ids:
        return []

    requests = (
        db.query(StudentLeaveRequest)
        .options(
            joinedload(StudentLeaveRequest.student),
            joinedload(StudentLeaveRequest.mentor),
            joinedload(StudentLeaveRequest.class_advisor),
            joinedload(StudentLeaveRequest.hod),
        )
        .filter(
            StudentLeaveRequest.student_id.in_(student_ids),
            StudentLeaveRequest.status == StudentLeaveStatus.PENDING_CLASS_ADVISOR,
        )
        .order_by(StudentLeaveRequest.created_at.desc())
        .all()
    )
    return [_leave_with_student(r) for r in requests]


# ─────────────────────────────────────────────────────────
# 14. Class Advisor — Approve / Reject  →  next: PENDING_HOD
#     Validates faculty advises the student's current section
# ─────────────────────────────────────────────────────────

@router.put("/leave/{leave_id}/ca-action")
def class_advisor_action(
    leave_id: int,
    action: str,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    # Resolve sections this faculty advises
    advised_section_ids = [
        s.id for s in db.query(Section)
        .filter(Section.class_advisor_id == faculty.id, Section.is_active == True)
        .all()
    ]
    student_ids = [
        s.id for s in db.query(Student.id)
        .filter(Student.section_id.in_(advised_section_ids))
        .all()
    ] if advised_section_ids else []

    leave = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.id == leave_id,
        StudentLeaveRequest.student_id.in_(student_ids),
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found or not in your section")
    if leave.status != StudentLeaveStatus.PENDING_CLASS_ADVISOR:
        raise HTTPException(status_code=400, detail="Request is not pending class advisor action")

    leave.class_advisor_id = faculty.id   # stamp current CA
    leave.class_advisor_remarks = remarks
    leave.class_advisor_actioned_at = datetime.utcnow()

    if action.lower() == "approve":
        leave.status = StudentLeaveStatus.PENDING_HOD
    elif action.lower() == "reject":
        leave.status = StudentLeaveStatus.REJECTED
        leave.rejection_reason = remarks or "Rejected by class advisor"
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    db.commit()
    return _format_leave(_load_leave(leave.id, db))


# ─────────────────────────────────────────────────────────
# 15. HOD — Pending queue
# ─────────────────────────────────────────────────────────

@router.get("/leave/hod-queue")
def get_hod_leave_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != "hod":
        raise HTTPException(status_code=403, detail="HOD only")

    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    department = db.query(Department).filter(Department.hod_id == faculty.id).first()
    if not department:
        raise HTTPException(status_code=404, detail="No department assigned to this HOD")

    student_ids = [
        s.id for s in db.query(Student.id)
        .filter(Student.department_id == department.id)
        .all()
    ]

    requests = (
        db.query(StudentLeaveRequest)
        .options(
            joinedload(StudentLeaveRequest.student),
            joinedload(StudentLeaveRequest.mentor),
            joinedload(StudentLeaveRequest.class_advisor),
            joinedload(StudentLeaveRequest.hod),
        )
        .filter(
            StudentLeaveRequest.student_id.in_(student_ids),
            StudentLeaveRequest.status == StudentLeaveStatus.PENDING_HOD,
        )
        .order_by(StudentLeaveRequest.created_at.desc())
        .all()
    )
    return [_leave_with_student(r) for r in requests]


# ─────────────────────────────────────────────────────────
# 16. HOD — Approve / Reject  →  APPROVED / REJECTED
# ─────────────────────────────────────────────────────────

@router.put("/leave/{leave_id}/hod-action")
def hod_action(
    leave_id: int,
    action: str,
    remarks: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != "hod":
        raise HTTPException(status_code=403, detail="HOD only")

    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    department = db.query(Department).filter(Department.hod_id == faculty.id).first()

    student_ids = [
        s.id for s in db.query(Student.id)
        .filter(Student.department_id == department.id)
        .all()
    ]

    leave = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.id == leave_id,
        StudentLeaveRequest.student_id.in_(student_ids),
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != StudentLeaveStatus.PENDING_HOD:
        raise HTTPException(status_code=400, detail="Request is not pending HOD action")

    leave.hod_id = faculty.id
    leave.hod_remarks = remarks
    leave.hod_actioned_at = datetime.utcnow()

    if action.lower() == "approve":
        leave.status = StudentLeaveStatus.APPROVED
    elif action.lower() == "reject":
        leave.status = StudentLeaveStatus.REJECTED
        leave.rejection_reason = remarks or "Rejected by HOD"
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    db.commit()
    return _format_leave(_load_leave(leave.id, db))


# ─────────────────────────────────────────────────────────
# 17. My Class / Section Info
# ─────────────────────────────────────────────────────────

@router.get("/my-class")
def get_my_class_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns comprehensive information about the student's class (section),
    including Class Advisor, Mentor, classmates, and the timetable.
    """
    student = get_student_profile(current_user, db)
    if not student.section_id:
        raise HTTPException(status_code=400, detail="You are not assigned to a section.")

    section = db.query(Section).options(joinedload(Section.department)).filter(Section.id == student.section_id).first()
    
    # Class Advisor
    advisor_info = None
    if section.class_advisor_id:
        advisor = db.query(Faculty).filter(Faculty.id == section.class_advisor_id).first()
        if advisor:
            advisor_info = {
                "name": f"{advisor.first_name} {advisor.last_name}",
                "email": advisor.user.email if advisor.user else None,
                "phone": advisor.phone or None,
                "department": advisor.department.name if advisor.department else None,
                "designation": advisor.designation or None,
                "employee_id": advisor.employee_id or None,
            }

    # Mentor
    mentor_info = None
    mentor_assignment = db.query(MentorAssignment).filter(MentorAssignment.student_id == student.id).first()
    if mentor_assignment and mentor_assignment.mentor_id:
        mentor = db.query(Faculty).filter(Faculty.id == mentor_assignment.mentor_id).first()
        if mentor:
            mentor_info = {
                "name": f"{mentor.first_name} {mentor.last_name}",
                "email": mentor.user.email if mentor.user else None,
                "phone": mentor.phone or None,
                "department": mentor.department.name if mentor.department else None,
                "designation": mentor.designation or None,
                "employee_id": mentor.employee_id or None,
            }

    # Timetable
    # 1. Get all active course assignments for this section
    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.faculty)
    ).filter(
        CourseAssignment.section_id == section.id,
        CourseAssignment.is_active == True
    ).all()

    assignment_ids = [a.id for a in assignments]
    assignment_map = {a.id: a for a in assignments}

    # 2. Get timetable slots for these assignments
    from app.models.lms import TimetableSlot
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.course_assignment_id.in_(assignment_ids)
    ).order_by(TimetableSlot.day, TimetableSlot.start_time).all()

    timetable = []
    for slot in slots:
        assignment = assignment_map.get(slot.course_assignment_id)
        if assignment and assignment.course:
            faculty_name = f"{assignment.faculty.first_name} {assignment.faculty.last_name}" if assignment.faculty else "TBD"
            DAY_MAP = {
                "MON": "Monday",
                "TUE": "Tuesday",
                "WED": "Wednesday",
                "THU": "Thursday",
                "FRI": "Friday",
                "SAT": "Saturday",
                "SUN": "Sunday"
            }
            day_val = slot.day.value.upper() if hasattr(slot.day, 'value') else str(slot.day).upper()
            timetable.append({
                "id": slot.id,
                "day": DAY_MAP.get(day_val, day_val),
                "start_time": slot.start_time.isoformat() if slot.start_time else None,
                "end_time": slot.end_time.isoformat() if slot.end_time else None,
                "course_name": assignment.course.name,
                "course_code": assignment.course.code,
                "faculty_name": faculty_name,
                "room_number": slot.room
            })

    return {
        "section": {
            "name": section.name,
            "year": section.year,
            "batch": section.batch,
            "department": section.department.name if section.department else None,
        },
        "advisor": advisor_info,
        "mentor": mentor_info,
        "timetable": timetable
    }


@router.get("/courses/{course_id}/seminar")
def get_student_seminar_detail(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = get_student_profile(current_user, db)
    verify_course_enrollment(student, course_id, db)
    
    # Find the active course assignment for this student's section and course
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.course_id == course_id,
        CourseAssignment.section_id == student.section_id,
        CourseAssignment.is_active == True
    ).first()
    
    if not assignment:
        return {"seminar": None}
        
    sem = db.query(Seminar).filter(
        Seminar.course_assignment_id == assignment.id,
        Seminar.student_id == student.id
    ).first()
    
    if not sem:
        return {"seminar": None}
        
    result = {}
    # Topic and date are visible if is_topic_published is True
    if sem.is_topic_published:
        result["seminar_topic"] = sem.seminar_topic
        result["seminar_date"] = sem.seminar_date.strftime("%Y-%m-%d") if sem.seminar_date else None
        result["is_topic_published"] = True
    
    # Marks are visible if is_marks_published is True
    if sem.is_marks_published:
        result["marks_obtained"] = float(sem.marks_obtained) if sem.marks_obtained is not None else None
        result["max_marks"] = float(sem.max_marks)
        result["is_marks_published"] = True
        
    return {"seminar": result if result else None}

