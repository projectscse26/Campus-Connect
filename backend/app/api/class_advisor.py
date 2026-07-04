"""
Campus Connect ERP — Class Advisor API

All endpoints are scoped to the logged-in faculty's assigned section.
Faculty without a class advisor assignment will receive 403.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.academic import Section, Course, CourseAssignment, Enrollment
from app.models.attendance import Attendance, AttendanceStatus
from app.models.lms import TimetableSlot, LMSResource
from app.models.department import Department
from app.schemas.class_advisor import (
    ClassInfoResponse, CADashboardResponse,
    CAStudentListItem, CAStudentProfileResponse, EnrolledSubject,
    AttendanceStudentRow, AttendanceSaveRequest, AttendanceSaveResponse,
    AttendanceSummaryItem,
    CATimetableSlot, CASubjectItem, CACourseProgressItem
)

router = APIRouter()

# ── Helper ────────────────────────────────────────────────

def get_advisor_section(current_user: User, db: Session):
    """Resolve the Section this faculty is assigned as class advisor for."""
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    section = db.query(Section).filter(
        Section.class_advisor_id == faculty.id,
        Section.is_active == True
    ).first()

    if not section:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned as a Class Advisor for any section"
        )
    return faculty, section


def get_homeroom_course_id(section_id: int, db: Session) -> int:
    """
    Returns a course_id to use as the 'homeroom' key for section-level daily attendance.
    Uses the first active course assigned to this section.
    Raises 400 if no courses are assigned yet.
    """
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.section_id == section_id,
        CourseAssignment.is_active == True
    ).order_by(CourseAssignment.id).first()

    if not assignment:
        raise HTTPException(
            status_code=400,
            detail="No courses assigned to this section yet. Please assign at least one course before marking attendance."
        )
    return assignment.course_id


def build_class_info(faculty: Faculty, section: Section, db: Session) -> ClassInfoResponse:
    dept = db.query(Department).filter(Department.id == section.department_id).first()
    total = db.query(Student).filter(
        Student.section_id == section.id,
        Student.is_active == True
    ).count()
    # Derive current semester from year (odd semester of that year)
    semester = (section.year - 1) * 2 + 1
    return ClassInfoResponse(
        section_id=section.id,
        section_name=section.name,
        department_id=dept.id,
        department_name=dept.name,
        department_code=dept.code,
        year=section.year,
        batch=section.batch,
        semester=semester,
        total_students=total,
        advisor_name=f"{faculty.first_name} {faculty.last_name}"
    )


# ── Dashboard ─────────────────────────────────────────────

@router.get("/my-class", response_model=ClassInfoResponse)
def get_my_class(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    faculty, section = get_advisor_section(current_user, db)
    return build_class_info(faculty, section, db)


@router.get("/dashboard", response_model=CADashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    faculty, section = get_advisor_section(current_user, db)
    class_info = build_class_info(faculty, section, db)
    today = date.today()

    # Count today's attendance records for this section's students
    student_ids = [
        s.id for s in db.query(Student.id).filter(
            Student.section_id == section.id,
            Student.is_active == True
        ).all()
    ]

    present_today = 0
    absent_today = 0

    if student_ids:
        homeroom_course_id = None
        assignment = db.query(CourseAssignment).filter(
            CourseAssignment.section_id == section.id,
            CourseAssignment.is_active == True
        ).order_by(CourseAssignment.id).first()
        if assignment:
            homeroom_course_id = assignment.course_id

        base_q = db.query(Attendance).filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date == today,
            Attendance.course_id == homeroom_course_id
        )
        present_today = base_q.filter(Attendance.status == AttendanceStatus.PRESENT).count()
        absent_today  = base_q.filter(Attendance.status == AttendanceStatus.ABSENT).count()

    return CADashboardResponse(
        class_info=class_info,
        present_today=present_today,
        absent_today=absent_today,
        total_students=class_info.total_students
    )


# ── Student List ──────────────────────────────────────────

@router.get("/students", response_model=List[CAStudentListItem])
def get_students(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    query = db.query(Student).filter(
        Student.section_id == section.id,
        Student.is_active == True
    )

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Student.first_name + " " + Student.last_name).like(term)) |
            (func.lower(Student.register_number).like(term))
        )

    students = query.order_by(Student.register_number).all()

    return [
        CAStudentListItem(
            id=s.id,
            register_number=s.register_number,
            roll_number=s.register_number,
            first_name=s.first_name,
            last_name=s.last_name,
            phone=s.phone,
            gender=s.gender
        )
        for s in students
    ]


# ── Student Profile ───────────────────────────────────────

@router.get("/students/{student_id}", response_model=CAStudentProfileResponse)
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    student = db.query(Student).filter(
        Student.id == student_id,
        Student.section_id == section.id,
        Student.is_active == True
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your class")

    dept = db.query(Department).filter(Department.id == student.department_id).first()

    # Attendance percentage using homeroom course
    homeroom_course_id = None
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.section_id == section.id,
        CourseAssignment.is_active == True
    ).order_by(CourseAssignment.id).first()
    if assignment:
        homeroom_course_id = assignment.course_id

    total_days = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.course_id == homeroom_course_id
    ).count()

    present_days = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.course_id == homeroom_course_id,
        Attendance.status == AttendanceStatus.PRESENT
    ).count()

    attendance_pct = round((present_days / total_days * 100), 1) if total_days > 0 else 0.0

    # Enrolled subjects
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.course)
    ).filter(Enrollment.student_id == student.id).all()
    
    enrolled_subjects_map = {}
    for e in enrollments:
        if e.course:
            enrolled_subjects_map[e.course.id] = e.course

    if student.section_id:
        assignments = db.query(CourseAssignment).options(
            joinedload(CourseAssignment.course)
        ).filter(
            CourseAssignment.section_id == student.section_id,
            CourseAssignment.semester == student.current_semester,
            CourseAssignment.is_active == True
        ).all()
        for a in assignments:
            if a.course:
                enrolled_subjects_map[a.course.id] = a.course

    enrolled_subjects = [
        EnrolledSubject(
            id=course.id,
            code=course.code,
            name=course.name,
            credits=course.credits
        )
        for course in enrolled_subjects_map.values()
    ]

    return CAStudentProfileResponse(
        id=student.id,
        register_number=student.register_number,
        first_name=student.first_name,
        last_name=student.last_name,
        department_name=dept.name if dept else "",
        department_code=dept.code if dept else "",
        year=student.current_year or section.year,
        semester=student.current_semester,
        section_name=section.name,
        phone=student.phone,
        gender=student.gender,
        overall_attendance_percentage=attendance_pct,
        enrolled_subjects=enrolled_subjects
    )


# ── Daily Attendance ──────────────────────────────────────

@router.get("/attendance", response_model=List[AttendanceStudentRow])
def get_attendance_for_date(
    date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    students = db.query(Student).filter(
        Student.section_id == section.id,
        Student.is_active == True
    ).order_by(Student.register_number).all()

    student_ids = [s.id for s in students]

    # Fetch existing records for this date using homeroom course id
    existing = {}
    if student_ids:
        homeroom_course_id = None
        assignment = db.query(CourseAssignment).filter(
            CourseAssignment.section_id == section.id,
            CourseAssignment.is_active == True
        ).order_by(CourseAssignment.id).first()
        if assignment:
            homeroom_course_id = assignment.course_id

        records = db.query(Attendance).filter(
            Attendance.student_id.in_(student_ids),
            Attendance.date == date,
            Attendance.course_id == homeroom_course_id
        ).all()
        existing = {r.student_id: r.status.value for r in records}

    return [
        AttendanceStudentRow(
            student_id=s.id,
            register_number=s.register_number,
            first_name=s.first_name,
            last_name=s.last_name,
            status=existing.get(s.id)
        )
        for s in students
    ]


@router.post("/attendance", response_model=AttendanceSaveResponse)
def save_attendance(
    payload: AttendanceSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    faculty, section = get_advisor_section(current_user, db)

    # Only allow editing today's attendance
    if payload.date != date.today():
        raise HTTPException(
            status_code=400,
            detail="Attendance can only be marked or edited for today"
        )

    # Validate all students belong to this section
    section_student_ids = {
        s.id for s in db.query(Student.id).filter(
            Student.section_id == section.id,
            Student.is_active == True
        ).all()
    }

    homeroom_course_id = get_homeroom_course_id(section.id, db)

    saved = 0
    for record in payload.records:
        if record.student_id not in section_student_ids:
            continue

        try:
            att_status = AttendanceStatus(record.status)
        except ValueError:
            continue

        # Upsert: update if exists, insert if not
        existing = db.query(Attendance).filter(
            Attendance.student_id == record.student_id,
            Attendance.date == payload.date,
            Attendance.course_id == homeroom_course_id
        ).first()

        if existing:
            existing.status = att_status
            existing.marked_by_id = faculty.id
        else:
            new_att = Attendance(
                student_id=record.student_id,
                course_id=homeroom_course_id,
                date=payload.date,
                status=att_status,
                marked_by_id=faculty.id
            )
            db.add(new_att)
        saved += 1

    db.commit()
    return AttendanceSaveResponse(message="Attendance saved successfully", saved=saved)


# ── Attendance Summary ────────────────────────────────────

@router.get("/attendance-summary", response_model=List[AttendanceSummaryItem])
def get_attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    students = db.query(Student).filter(
        Student.section_id == section.id,
        Student.is_active == True
    ).order_by(Student.register_number).all()

    homeroom_course_id = None
    assignment = db.query(CourseAssignment).filter(
        CourseAssignment.section_id == section.id,
        CourseAssignment.is_active == True
    ).order_by(CourseAssignment.id).first()
    if assignment:
        homeroom_course_id = assignment.course_id

    result = []
    for s in students:
        total_days = db.query(Attendance).filter(
            Attendance.student_id == s.id,
            Attendance.course_id == homeroom_course_id
        ).count()

        present_days = db.query(Attendance).filter(
            Attendance.student_id == s.id,
            Attendance.course_id == homeroom_course_id,
            Attendance.status == AttendanceStatus.PRESENT
        ).count()

        pct = round((present_days / total_days * 100), 1) if total_days > 0 else 0.0

        result.append(AttendanceSummaryItem(
            student_id=s.id,
            register_number=s.register_number,
            first_name=s.first_name,
            last_name=s.last_name,
            present_days=present_days,
            total_days=total_days,
            percentage=pct
        ))

    return result


# ── Timetable ─────────────────────────────────────────────

@router.get("/timetable", response_model=List[CATimetableSlot])
def get_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.faculty)
    ).filter(
        CourseAssignment.section_id == section.id,
        CourseAssignment.is_active == True
    ).all()

    assignment_map = {a.id: a for a in assignments}
    assignment_ids = list(assignment_map.keys())

    if not assignment_ids:
        return []

    slots = db.query(TimetableSlot).filter(
        TimetableSlot.course_assignment_id.in_(assignment_ids)
    ).order_by(TimetableSlot.day, TimetableSlot.start_time).all()

    result = []
    for slot in slots:
        assignment = assignment_map.get(slot.course_assignment_id)
        if not assignment:
            continue
        result.append(CATimetableSlot(
            id=slot.id,
            day=slot.day.value if hasattr(slot.day, 'value') else slot.day,
            start_time=slot.start_time.strftime("%H:%M") if hasattr(slot.start_time, 'strftime') else str(slot.start_time),
            end_time=slot.end_time.strftime("%H:%M") if hasattr(slot.end_time, 'strftime') else str(slot.end_time),
            room=slot.room,
            subject_code=assignment.course.short_name or assignment.course.code,
            subject_name=assignment.course.name,
            faculty_name=f"{assignment.faculty.first_name} {assignment.faculty.last_name}"
        ))

    return result


# ── Class Subjects ────────────────────────────────────────

@router.get("/subjects", response_model=List[CASubjectItem])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.faculty)
    ).filter(
        CourseAssignment.section_id == section.id,
        CourseAssignment.is_active == True
    ).all()

    return [
        CASubjectItem(
            course_id=a.course.id,
            code=a.course.code,
            name=a.course.name,
            credits=a.course.credits,
            course_type=a.course.course_type.value if a.course.course_type else "theory",
            faculty_name=f"{a.faculty.first_name} {a.faculty.last_name}"
        )
        for a in assignments if a.course and a.faculty
    ]


# ── Course Progress ───────────────────────────────────────

@router.get("/course-progress", response_model=List[CACourseProgressItem])
def get_course_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    _, section = get_advisor_section(current_user, db)

    assignments = db.query(CourseAssignment).options(
        joinedload(CourseAssignment.course),
        joinedload(CourseAssignment.faculty)
    ).filter(
        CourseAssignment.section_id == section.id,
        CourseAssignment.is_active == True
    ).all()

    result = []
    for a in assignments:
        if not a.course or not a.faculty:
            continue

        # Use uploaded LMS resource count as units completed proxy
        units_completed = db.query(LMSResource).filter(
            LMSResource.course_id == a.course_id
        ).count()

        result.append(CACourseProgressItem(
            course_id=a.course.id,
            subject_code=a.course.code,
            subject_name=a.course.name,
            faculty_name=f"{a.faculty.first_name} {a.faculty.last_name}",
            units_completed=units_completed,
            total_units=5  # default until a units table exists
        ))

    return result
