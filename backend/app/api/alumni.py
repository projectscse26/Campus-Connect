from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.models.student import Student
from app.models.user import User
from app.api.auth import get_current_active_user

router = APIRouter(
    prefix="/alumni",
    tags=["Alumni"]
)

from app.models.alumni import Alumni as OldAlumni

@router.get("/")
def get_all_alumni(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all alumni (graduated students) across all departments.
    Only accessible by admins.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view all alumni")

    # Fetch newly graduated soft-deleted students
    new_alumni = db.query(Student).options(
        joinedload(Student.department)
    ).filter(Student.is_alumni == True).all()

    # Fetch legacy alumni from the old dedicated table
    legacy_alumni = db.query(OldAlumni).options(
        joinedload(OldAlumni.department)
    ).all()

    # Merge them into a standard format for the frontend
    result = []
    
    for s in new_alumni:
        result.append({
            "id": f"new_{s.id}",
            "first_name": s.first_name,
            "last_name": s.last_name,
            "register_number": s.register_number,
            "batch": s.batch,
            "college_email": s.college_email,
            "phone": s.phone,
            "department": s.department
        })
        
    for a in legacy_alumni:
        result.append({
            "id": f"old_{a.id}",
            "first_name": a.first_name,
            "last_name": a.last_name,
            "register_number": a.register_number,
            "batch": a.batch,
            "college_email": a.college_email,
            "phone": a.phone,
            "department": a.department
        })

    return result

@router.get("/{student_id}/records")
def get_alumni_records(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch comprehensive historical records for a specific alumni.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view records")

    is_legacy = student_id.startswith("old_")
    real_id = int(student_id.split("_")[1]) if "_" in student_id else int(student_id)

    if is_legacy:
        # Legacy alumni were permanently deleted from Student table, so their relations are gone due to cascade.
        # Just return an empty structured object.
        return {
            "grades": [],
            "attendance": [],
            "gate_passes": [],
            "leaves": []
        }
    
    # Newly soft-deleted alumni still have all their data
    student = db.query(Student).filter(Student.id == real_id).first()
    if not student or not student.is_alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")

    # To avoid huge nested JSON payloads crashing, we will query them separately
    from app.models.grade import Grade
    from app.models.attendance import Attendance
    from app.models.gatepass import GatePass
    from app.models.leave import StudentLeaveRequest
    from app.models.course import Course

    grades = db.query(Grade).options(joinedload(Grade.course)).filter(Grade.student_id == real_id).all()
    attendance = db.query(Attendance).options(joinedload(Attendance.course)).filter(Attendance.student_id == real_id).all()
    gate_passes = db.query(GatePass).filter(GatePass.student_id == real_id).all()
    leaves = db.query(StudentLeaveRequest).filter(StudentLeaveRequest.student_id == real_id).all()

    return {
        "grades": grades,
        "attendance": attendance,
        "gate_passes": gate_passes,
        "leaves": leaves
    }

@router.get("/batch-courses")
def get_batch_courses(
    department_name: str,
    semester: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch courses for a specific department and semester.
    """
    from app.models.department import Department
    from app.models.academic import Course
    
    dept = db.query(Department).filter(Department.name == department_name).first()
    if not dept:
        return []
        
    courses = db.query(Course).filter(Course.department_id == dept.id, Course.semester == semester).all()
    return courses

@router.get("/batch-course-data")
def get_batch_course_data(
    batch: str,
    department_name: str,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch all students in a batch and their attendance and grades for a specific course.
    """
    from app.models.department import Department
    from app.models.grade import Grade
    from app.models.attendance import Attendance
    
    dept = db.query(Department).filter(Department.name == department_name).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Fetch students in this batch and dept (only graduated soft-deleted ones)
    students = db.query(Student).filter(
        Student.batch == batch,
        Student.department_id == dept.id,
        Student.is_alumni == True
    ).all()
    
    student_ids = [s.id for s in students]
    
    if not student_ids:
        return {"students": [], "attendance": [], "grades": []}
        
    # Fetch attendance for these students for this course
    attendance = db.query(Attendance).filter(
        Attendance.course_id == course_id,
        Attendance.student_id.in_(student_ids)
    ).all()
    
    # Fetch grades for these students for this course
    grades = db.query(Grade).filter(
        Grade.course_id == course_id,
        Grade.student_id.in_(student_ids)
    ).all()
    
    return {
        "students": students,
        "attendance": attendance,
        "grades": grades
    }
