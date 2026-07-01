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

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.models.academic import Course, CourseAssignment, Enrollment
from app.models.lms import LMSResource, Announcement
from app.models.attendance import Attendance
from app.models.faculty import Faculty
from app.models.department import Department

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

    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "file_url": a.file_url,
            "external_link": a.external_link,
            "uploaded_by": f"{a.uploaded_by.first_name} {a.uploaded_by.last_name}" if a.uploaded_by else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "due_date": None,
        }
        for a in assignments
    ]


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
