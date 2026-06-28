from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, time, datetime, timedelta

from app.core.database import get_db
from app.models.late import LateRecord
from app.models.student import Student
from app.models.user import User
from app.schemas.late import LateRecordCreate, LateRecordResponse, LateAnalytics
from app.core.security import get_current_active_user

router = APIRouter()

def _serialize_late(record: LateRecord) -> dict:
    reporter_name = record.recorded_by.email if record.recorded_by else None
    if record.recorded_by and getattr(record.recorded_by, 'faculty_profile', None):
        reporter_name = f"{record.recorded_by.faculty_profile.first_name} {record.recorded_by.faculty_profile.last_name}"
    elif record.recorded_by and record.recorded_by.role.value == 'admin':
        reporter_name = 'Admin'
    elif record.recorded_by and record.recorded_by.role.value == 'late_tracker':
        reporter_name = 'Late Tracker'

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
        "reporter_name": reporter_name
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

    new_record = LateRecord(
        student_id=record_in.student_id,
        recorded_by_id=current_user.id,
        date=record_in.date or date.today(),
        time=record_in.time or datetime.now().time(),
        reason=record_in.reason,
        remarks=record_in.remarks,
        action_status=record_in.action_status
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return _serialize_late(new_record)


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
    return [_serialize_late(r) for r in records]


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
