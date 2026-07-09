from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.authority import Authority
from app.models.academic import MentorAssignment, Section
from app.models.gatepass import GatePass, GatePassStatus
from app.models.leave import StudentLeaveRequest, StudentLeaveStatus
from app.models.late import LateEntryNotification

router = APIRouter()

@router.get("/badge-counts", response_model=Dict[str, int])
def get_badge_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    counts = {
        "/faculty/gatepass": 0,
        "/faculty/late-entry": 0,
        "/faculty/mentorship": 0,
        "/faculty/class-advisor/leave": 0,
        "/hod/leave": 0,
        "/hod/gatepass": 0,
        "/authority/gatepass": 0
    }
    
    # Faculty or HOD (who also has faculty role/duties)
    if current_user.role in [UserRole.FACULTY, UserRole.HOD]:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            # 1. Mentor count of pending gate passes not seen
            mentees_sub = db.query(MentorAssignment.student_id).filter(
                MentorAssignment.mentor_id == faculty.id
            ).subquery()
            
            mentor_gp_count = db.query(GatePass).filter(
                GatePass.student_id.in_(mentees_sub),
                GatePass.status == GatePassStatus.PENDING_MENTOR,
                GatePass.viewed_by_mentor == False,
                GatePass.is_deleted_by_student == False
            ).count()
            counts["/faculty/gatepass"] = mentor_gp_count

            # 2. Mentor count of pending late arrival notices not seen
            mentor_late_count = db.query(LateEntryNotification).filter(
                LateEntryNotification.mentor_id == faculty.id,
                LateEntryNotification.viewed_by_mentor == False
            ).count()
            counts["/faculty/late-entry"] = mentor_late_count

            # 3. Mentor count of pending leave requests not seen
            mentor_leave_count = db.query(StudentLeaveRequest).filter(
                StudentLeaveRequest.student_id.in_(mentees_sub),
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_MENTOR,
                StudentLeaveRequest.viewed_by_mentor == False
            ).count()
            counts["/faculty/mentorship"] = mentor_leave_count

            # 4. Class Advisor count of pending leave requests not seen (only if they are CA)
            advised_sections = db.query(Section.id).filter(
                Section.class_advisor_id == faculty.id,
                Section.is_active == True
            ).subquery()
            
            ca_students = db.query(Student.id).filter(
                Student.section_id.in_(advised_sections)
            ).subquery()

            ca_leave_count = db.query(StudentLeaveRequest).filter(
                StudentLeaveRequest.student_id.in_(ca_students),
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_CLASS_ADVISOR,
                StudentLeaveRequest.viewed_by_ca == False
            ).count()
            counts["/faculty/class-advisor/leave"] = ca_leave_count

    if current_user.role == UserRole.HOD:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            # HOD count of pending gate passes in department not seen
            hod_gp_count = db.query(GatePass).join(Student).filter(
                Student.department_id == faculty.department_id,
                GatePass.status == GatePassStatus.PENDING_HOD,
                GatePass.viewed_by_hod == False,
                GatePass.is_deleted_by_student == False
            ).count()
            counts["/hod/gatepass"] = hod_gp_count

            # HOD count of pending leave requests in department not seen
            dept_students = db.query(Student.id).filter(
                Student.department_id == faculty.department_id
            ).subquery()
            
            hod_leave_count = db.query(StudentLeaveRequest).filter(
                StudentLeaveRequest.student_id.in_(dept_students),
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_HOD,
                StudentLeaveRequest.viewed_by_hod == False
            ).count()
            counts["/hod/leave"] = hod_leave_count

    if current_user.role == UserRole.AUTHORITY:
        # OM / Authority count of pending gate passes not seen
        om_gp_count = db.query(GatePass).filter(
            GatePass.status == GatePassStatus.PENDING_OM,
            GatePass.viewed_by_om == False,
            GatePass.is_deleted_by_student == False
        ).count()
        counts["/authority/gatepass"] = om_gp_count

    return counts

@router.put("/mark-viewed")
def mark_sector_viewed(
    sector: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark all pending items in a specific sector as viewed by the current user.
    """
    if current_user.role in [UserRole.FACULTY, UserRole.HOD]:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")
        
        # Mentees subquery
        mentees_sub = db.query(MentorAssignment.student_id).filter(
            MentorAssignment.mentor_id == faculty.id
        ).subquery()

        if sector == "gatepass":
            # For mentor
            db.query(GatePass).filter(
                GatePass.student_id.in_(mentees_sub),
                GatePass.status == GatePassStatus.PENDING_MENTOR,
                GatePass.viewed_by_mentor == False
            ).update({GatePass.viewed_by_mentor: True}, synchronize_session=False)
            
            # For HOD (if user is HOD, they will also have /hod/gatepass marked viewed)
            if current_user.role == UserRole.HOD:
                db.query(GatePass).join(Student).filter(
                    Student.department_id == faculty.department_id,
                    GatePass.status == GatePassStatus.PENDING_HOD,
                    GatePass.viewed_by_hod == False
                ).update({GatePass.viewed_by_hod: True}, synchronize_session=False)

        elif sector == "late-entry":
            db.query(LateEntryNotification).filter(
                LateEntryNotification.mentor_id == faculty.id,
                LateEntryNotification.viewed_by_mentor == False
            ).update({LateEntryNotification.viewed_by_mentor: True}, synchronize_session=False)

        elif sector == "leave-mentor":
            db.query(StudentLeaveRequest).filter(
                StudentLeaveRequest.student_id.in_(mentees_sub),
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_MENTOR,
                StudentLeaveRequest.viewed_by_mentor == False
            ).update({StudentLeaveRequest.viewed_by_mentor: True}, synchronize_session=False)

        elif sector == "leave-ca":
            advised_sections = db.query(Section.id).filter(
                Section.class_advisor_id == faculty.id,
                Section.is_active == True
            ).subquery()
            
            ca_students = db.query(Student.id).filter(
                Student.section_id.in_(advised_sections)
            ).subquery()

            db.query(StudentLeaveRequest).filter(
                StudentLeaveRequest.student_id.in_(ca_students),
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_CLASS_ADVISOR,
                StudentLeaveRequest.viewed_by_ca == False
            ).update({StudentLeaveRequest.viewed_by_ca: True}, synchronize_session=False)

        elif sector == "leave-hod" and current_user.role == UserRole.HOD:
            dept_students = db.query(Student.id).filter(
                Student.department_id == faculty.department_id
            ).subquery()

            db.query(StudentLeaveRequest).filter(
                StudentLeaveRequest.student_id.in_(dept_students),
                StudentLeaveRequest.status == StudentLeaveStatus.PENDING_HOD,
                StudentLeaveRequest.viewed_by_hod == False
            ).update({StudentLeaveRequest.viewed_by_hod: True}, synchronize_session=False)
            
    if current_user.role == UserRole.AUTHORITY:
        if sector == "gatepass":
            db.query(GatePass).filter(
                GatePass.status == GatePassStatus.PENDING_OM,
                GatePass.viewed_by_om == False
            ).update({GatePass.viewed_by_om: True}, synchronize_session=False)
            
    db.commit()
    return {"message": "Success"}
