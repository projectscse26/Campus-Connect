from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract, or_
from typing import List, Optional
from datetime import date, time, datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.core.database import get_db
from app.models.late import LateRecord, LateEntryNotification
from app.models.student import Student
from app.models.user import User
from app.models.academic import MentorAssignment, Section
from app.models.discipline import ActionStatus
from app.models.department import Department
from app.schemas.late import (
    LateRecordCreate, LateRecordResponse, LateAnalytics,
    LateEntryNotificationCreate, LateEntryNotificationResponse, LateEntryUsageSummary
)
from app.core.security import get_current_active_user

router = APIRouter()

# Configuration
MONTHLY_LATE_ENTRY_LIMIT = 5

def _serialize_late(record: LateRecord, db: Session = None) -> dict:
    reporter_name = record.recorded_by.email if record.recorded_by else None
    if record.recorded_by and getattr(record.recorded_by, 'faculty_profile', None):
        reporter_name = f"{record.recorded_by.faculty_profile.first_name} {record.recorded_by.faculty_profile.last_name}"
    elif record.recorded_by and record.recorded_by.role.value == 'admin':
        reporter_name = 'Admin'
    elif record.recorded_by and record.recorded_by.role.value == 'late_tracker':
        reporter_name = 'Late Tracker'

    # Check if student has prior notification for this date
    has_prior_notification = False
    if db and record.student_id and record.date:
        notification = db.query(LateEntryNotification).filter(
            and_(
                LateEntryNotification.student_id == record.student_id,
                LateEntryNotification.date == record.date
            )
        ).first()
        has_prior_notification = notification is not None

    return {
        "id": record.id,
        "student_id": record.student_id,
        "recorded_by_id": record.recorded_by_id,
        "date": record.date,
        "time": record.time,
        "reason": record.reason,
        "remarks": record.remarks,
        "action_status": record.action_status,
        "created_at": record.created_at,
        "student_name": f"{record.student.first_name} {record.student.last_name}" if record.student else None,
        "student_register_number": record.student.register_number if record.student else None,
        "reporter_name": reporter_name,
        "has_prior_notification": has_prior_notification
    }

@router.post("/", response_model=LateRecordResponse, status_code=status.HTTP_201_CREATED)
def create_late_record(
    record_in: LateRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new late record.
    Accessible by late_tracker, admin.
    """
    if current_user.role.value not in ["admin", "late_tracker", "hod", "authority"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to mark students late")

    student = db.query(Student).filter(Student.id == record_in.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    target_date = record_in.date or date.today()
    status = record_in.action_status

    if not status or status == ActionStatus.NOT_INFORMED:
        has_notification = db.query(LateEntryNotification).filter(
            and_(
                LateEntryNotification.student_id == record_in.student_id,
                LateEntryNotification.date == target_date
            )
        ).first()
        if has_notification:
            status = ActionStatus.INFORMED
            has_notification.acknowledged_by_security = True
            has_notification.acknowledged_at = datetime.now()

    new_record = LateRecord(
        student_id=record_in.student_id,
        recorded_by_id=current_user.id,
        date=target_date,
        time=record_in.time or datetime.now().time(),
        reason=record_in.reason,
        remarks=record_in.remarks,
        action_status=status
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return _serialize_late(new_record, db)


@router.get("/", response_model=List[LateRecordResponse])
def get_late_records(
    department_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    View late records.
    HOD can view their dept. Late_tracker can view all recent.
    """
    query = db.query(LateRecord).join(Student)
    
    if current_user.role.value == "hod":
        if not current_user.faculty_profile:
            raise HTTPException(status_code=400, detail="HOD profile not found")
        query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
    elif department_id and current_user.role.value in ["admin", "authority"]:
        query = query.filter(Student.department_id == department_id)
        
    if start_date:
        query = query.filter(LateRecord.date >= start_date)
    if end_date:
        query = query.filter(LateRecord.date <= end_date)
        
    records = query.order_by(LateRecord.created_at.desc()).limit(limit).all()
    return [_serialize_late(r, db) for r in records]


@router.get("/analytics", response_model=LateAnalytics)
def get_late_analytics(
    department_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.value not in ["admin", "hod", "authority"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view analytics")

    query = db.query(LateRecord).join(Student)
    
    if current_user.role.value == "hod":
        if not current_user.faculty_profile:
            raise HTTPException(status_code=400, detail="HOD profile not found")
        query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
    elif department_id:
        query = query.filter(Student.department_id == department_id)

    if start_date:
        query = query.filter(LateRecord.date >= start_date)
    if end_date:
        query = query.filter(LateRecord.date <= end_date)

    total_lates = query.count()

    # Dynamic Trend
    actual_end_date = end_date or date.today()
    actual_start_date = start_date or (actual_end_date - timedelta(days=6))
    
    # Cap maximum days to prevent huge arrays (e.g. max 30 days)
    delta_days = (actual_end_date - actual_start_date).days
    if delta_days > 30:
        # If range is large, maybe group by week or month, but for simplicity we'll just show the last 30 days of the range, or we can just return what we have
        # Let's just return all days in range, frontend will handle it
        pass

    trend_data = (
        query
        .with_entities(LateRecord.date, func.count(LateRecord.id).label("count"))
        .group_by(LateRecord.date)
        .all()
    )
    
    trend_dict = {str(d.date): d.count for d in trend_data}
    recent_trend = []
    
    # Build array for every day in the range to ensure zero-count days are included
    for i in range(delta_days + 1):
        d = actual_start_date + timedelta(days=i)
        d_str = str(d)
        recent_trend.append({
            "date": d_str,
            "count": trend_dict.get(d_str, 0)
        })

    # Frequent latecomers
    frequent_data = (
        query.with_entities(
            LateRecord.student_id, 
            Student.first_name,
            Student.last_name,
            Student.register_number,
            func.count(LateRecord.id).label("count")
        )
        .group_by(LateRecord.student_id, Student.first_name, Student.last_name, Student.register_number)
        .order_by(func.count(LateRecord.id).desc())
        .limit(5)
        .all()
    )
    
    frequent_latecomers = [
        {
            "student_id": row.student_id,
            "name": f"{row.first_name} {row.last_name}",
            "register_number": row.register_number,
            "count": row.count
        } for row in frequent_data
    ]

    return {
        "total_lates": total_lates,
        "recent_trend": recent_trend,
        "frequent_latecomers": frequent_latecomers
    }


# ============================================================================
# LATE ENTRY NOTIFICATION ENDPOINTS (Student self-reporting)
# ============================================================================

@router.get("/notifications/usage", response_model=LateEntryUsageSummary)
def get_late_entry_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the current month's late entry notification usage for the logged-in student.
    """
    print(f"DEBUG: User role = {current_user.role}, User ID = {current_user.id}")  # Debug
    
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can access this endpoint")
    
    if not current_user.student_profile:
        print(f"DEBUG: No student profile found for user {current_user.id}")  # Debug
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    
    # Get current month start and end (based on submission date, not late arrival date)
    today = date.today()
    month_start = datetime(today.year, today.month, 1)
    if today.month == 12:
        month_end = datetime(today.year + 1, 1, 1)
    else:
        month_end = datetime(today.year, today.month + 1, 1)
    
    # Count notifications submitted this month
    used = db.query(func.count(LateEntryNotification.id)).filter(
        and_(
            LateEntryNotification.student_id == current_user.student_profile.id,
            LateEntryNotification.created_at >= month_start,
            LateEntryNotification.created_at < month_end
        )
    ).scalar() or 0
    
    remaining = max(0, MONTHLY_LATE_ENTRY_LIMIT - used)
    can_submit = remaining > 0
    
    return {
        "used": used,
        "remaining": remaining,
        "monthly_limit": MONTHLY_LATE_ENTRY_LIMIT,
        "can_submit": can_submit
    }


@router.post("/notifications", response_model=LateEntryNotificationResponse, status_code=status.HTTP_201_CREATED)
def create_late_entry_notification(
    notification_in: LateEntryNotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Student submits a late entry notification.
    No approval workflow - this is information only for Phase 1.
    Students can submit anytime.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can submit late entry notifications")
    
    if not current_user.student_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    
    student = current_user.student_profile
    
    # Check monthly limit (based on submission month, not late arrival date)
    today = date.today()
    month_start = datetime(today.year, today.month, 1)
    if today.month == 12:
        month_end = datetime(today.year + 1, 1, 1)
    else:
        month_end = datetime(today.year, today.month + 1, 1)
    
    monthly_count = db.query(func.count(LateEntryNotification.id)).filter(
        and_(
            LateEntryNotification.student_id == student.id,
            LateEntryNotification.created_at >= month_start,
            LateEntryNotification.created_at < month_end
        )
    ).scalar() or 0
    
    if monthly_count >= MONTHLY_LATE_ENTRY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Monthly limit of {MONTHLY_LATE_ENTRY_LIMIT} late entry notifications reached"
        )
    
    # Check cutoff time: Cannot submit a request for today after 8:40 AM
    # if notification_in.date == today:
    #     current_time = datetime.now().time()
    #     cutoff_time = time(8, 40)
    #     if current_time > cutoff_time:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="Late entry notifications for today cannot be submitted after 08:40 AM"
    #         )
    
    # Check if already submitted for this date
    existing = db.query(LateEntryNotification).filter(
        and_(
            LateEntryNotification.student_id == student.id,
            LateEntryNotification.date == notification_in.date
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a late entry notification for this date"
        )
    
    # Get mentor/class advisor
    mentor_assignment = db.query(MentorAssignment).filter(
        MentorAssignment.student_id == student.id
    ).first()
    
    mentor_id = mentor_assignment.mentor_id if mentor_assignment else None
    
    # Create notification
    new_notification = LateEntryNotification(
        student_id=student.id,
        mentor_id=mentor_id,
        date=notification_in.date,
        expected_arrival_time=notification_in.expected_arrival_time,
        reason=notification_in.reason
    )
    
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    # Mentor will see it on their dashboard
    
    return _serialize_notification(new_notification, db, current_user)


@router.get("/notifications/my-history", response_model=List[LateEntryNotificationResponse])
def get_my_late_entry_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the late entry notification history for the logged-in student.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can access this endpoint")
    
    if not current_user.student_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    
    notifications = db.query(LateEntryNotification).filter(
        LateEntryNotification.student_id == current_user.student_profile.id
    ).order_by(LateEntryNotification.created_at.desc()).limit(limit).all()
    
    return [_serialize_notification(n, db, current_user) for n in notifications]


@router.get("/notifications", response_model=List[LateEntryNotificationResponse])
def get_late_entry_notifications(
    date_filter: Optional[date] = None,
    department_id: Optional[int] = None,
    unacknowledged_only: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get late entry notifications.
    - late_tracker/security can view all or filter by date
    - faculty can view notifications for their mentees
    - admin/hod can view all or filter by department
    """
    query = db.query(LateEntryNotification).join(Student)
    
    if current_user.role == "late_tracker":
        # Security can view all, especially for today
        if date_filter:
            query = query.filter(LateEntryNotification.date == date_filter)
        else:
            # Default to today for late tracker
            query = query.filter(LateEntryNotification.date == date.today())
            
        if unacknowledged_only:
            query = query.filter(LateEntryNotification.acknowledged_by_security == False)
            
    elif current_user.role == "faculty":
        # Faculty can see their mentees' and class students' notifications
        if not current_user.faculty_profile:
            raise HTTPException(status_code=400, detail="Faculty profile not found")
        
        advised_sections = db.query(Section.id).filter(
            Section.class_advisor_id == current_user.faculty_profile.id,
            Section.is_active == True
        ).all()
        advised_section_ids = [s.id for s in advised_sections]
        
        query = query.filter(
            or_(
                LateEntryNotification.mentor_id == current_user.faculty_profile.id,
                Student.section_id.in_(advised_section_ids)
            )
        )
        
    elif current_user.role == "hod":
        # HOD can see their department's notifications
        if not current_user.faculty_profile:
            raise HTTPException(status_code=400, detail="HOD profile not found")
        query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
        
    elif current_user.role.value in ["admin", "authority"]:
        # Admin can filter by department
        if department_id:
            query = query.filter(Student.department_id == department_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view notifications")
    
    if date_filter and current_user.role.value != "late_tracker":
        query = query.filter(LateEntryNotification.date == date_filter)
    
    notifications = query.order_by(LateEntryNotification.created_at.desc()).limit(limit).all()
    return [_serialize_notification(n, db, current_user) for n in notifications]


@router.patch("/notifications/{notification_id}/acknowledge", response_model=LateEntryNotificationResponse)
def acknowledge_late_entry_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark a late entry notification as acknowledged by security/late tracker.
    Anyone with access to late tracker (admin, late_tracker, security, etc.) can acknowledge.
    """
    # Allow late_tracker, admin, or any role that has access to late tracking
    # More permissive to accommodate different security roles
    allowed_roles = ["late_tracker", "admin", "security", "watchman"]
    if current_user.role not in allowed_roles and current_user.role != "admin":
        # If not in allowed roles, still allow if user is authenticated (fallback for flexibility)
        pass
    
    notification = db.query(LateEntryNotification).filter(
        LateEntryNotification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification.acknowledged_by_security = True
    notification.acknowledged_at = datetime.now()
    
    db.commit()
    db.refresh(notification)
    
    return _serialize_notification(notification, db, current_user)


@router.patch("/notifications/{notification_id}/mark-viewed", response_model=LateEntryNotificationResponse)
def mark_notification_viewed(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark a late entry notification as viewed by mentor.
    Only the assigned mentor can mark it as viewed.
    """
    if current_user.role != "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty can mark notifications as viewed")
    
    if not current_user.faculty_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty profile not found")
    
    notification = db.query(LateEntryNotification).filter(
        LateEntryNotification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    # Verify that the current user is the assigned mentor or the class advisor
    is_mentor = notification.mentor_id == current_user.faculty_profile.id
    is_class_advisor = False
    
    if notification.student and notification.student.section_id:
        section = db.query(Section).filter(Section.id == notification.student.section_id).first()
        if section and section.class_advisor_id == current_user.faculty_profile.id:
            is_class_advisor = True
            
    if not is_mentor and not is_class_advisor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only mark notifications for your mentees or class students")
    
    notification.viewed_by_mentor = True
    notification.viewed_at = datetime.now()
    
    db.commit()
    db.refresh(notification)
    
    return _serialize_notification(notification, db, current_user)


def _serialize_notification(notification: LateEntryNotification, db: Session, current_user: User = None) -> dict:
    """Helper function to serialize LateEntryNotification with related data"""
    student = notification.student
    department = db.query(Department).filter(Department.id == student.department_id).first() if student else None
    section = db.query(Section).filter(Section.id == student.section_id).first() if student else None
    mentor = notification.mentor if notification.mentor_id else None
    
    is_mentee = False
    is_class_student = False
    if current_user and current_user.role.value == "faculty" and current_user.faculty_profile:
        is_mentee = notification.mentor_id == current_user.faculty_profile.id
        if section and section.class_advisor_id == current_user.faculty_profile.id:
            is_class_student = True
            
    return {
        "id": notification.id,
        "student_id": notification.student_id,
        "mentor_id": notification.mentor_id,
        "date": notification.date,
        "expected_arrival_time": notification.expected_arrival_time,
        "reason": notification.reason,
        "acknowledged_by_security": notification.acknowledged_by_security,
        "acknowledged_at": notification.acknowledged_at,
        "viewed_by_mentor": notification.viewed_by_mentor,
        "viewed_at": notification.viewed_at,
        "mentor_comment": notification.mentor_comment,
        "mentor_comment_at": notification.mentor_comment_at,
        "created_at": notification.created_at,
        "student_name": f"{student.first_name} {student.last_name}" if student else None,
        "student_register_number": student.register_number if student else None,
        "department_name": department.name if department else None,
        "section_name": section.name if section else None,
        "mentor_name": f"{mentor.first_name} {mentor.last_name}" if mentor else None,
        "is_mentee": is_mentee,
        "is_class_student": is_class_student
    }


@router.patch("/notifications/{notification_id}/add-comment", response_model=LateEntryNotificationResponse)
def add_mentor_comment(
    notification_id: int,
    comment: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mentor adds an acknowledgment comment to a late entry notification.
    Only the assigned mentor can add comments.
    """
    if current_user.role != "faculty":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only faculty can add comments")
    
    if not current_user.faculty_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty profile not found")
    
    notification = db.query(LateEntryNotification).filter(
        LateEntryNotification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    # Verify that the current user is the assigned mentor or the class advisor
    is_mentor = notification.mentor_id == current_user.faculty_profile.id
    is_class_advisor = False
    
    if notification.student and notification.student.section_id:
        section = db.query(Section).filter(Section.id == notification.student.section_id).first()
        if section and section.class_advisor_id == current_user.faculty_profile.id:
            is_class_advisor = True
            
    if not is_mentor and not is_class_advisor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only comment on notifications for your mentees or class students")
    
    notification.mentor_comment = comment
    notification.mentor_comment_at = datetime.now()
    
    # Also mark as viewed if not already
    if not notification.viewed_by_mentor:
        notification.viewed_by_mentor = True
        notification.viewed_at = datetime.now()
    
    db.commit()
    db.refresh(notification)
    
    return _serialize_notification(notification, db, current_user)

