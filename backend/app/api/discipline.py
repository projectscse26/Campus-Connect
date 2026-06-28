from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.student import Student
from app.models.department import Department
from app.models.discipline import DisciplineRecord, IncidentCategory
from app.schemas.discipline import (
    DisciplineCreate, DisciplineUpdate, DisciplineResponse, 
    DisciplineAnalytics, CategoryCount, TrendPoint
)

router = APIRouter()

def _serialize_record(record: DisciplineRecord) -> dict:
    reporter_name = record.reported_by.email if record.reported_by else None
    if record.reported_by and record.reported_by.faculty_profile:
        reporter_name = f"{record.reported_by.faculty_profile.first_name} {record.reported_by.faculty_profile.last_name}"
    elif record.reported_by and record.reported_by.role == 'admin':
        reporter_name = 'Admin'

    return {
        "id": record.id,
        "student_id": record.student_id,
        "reported_by_id": record.reported_by_id,
        "incident_type": record.incident_type,
        "incident_date": record.incident_date,
        "remarks": record.remarks,
        "action_status": record.action_status,
        "action_taken": record.action_taken,
        "is_locked": record.is_locked,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
        "student_name": f"{record.student.first_name} {record.student.last_name}" if record.student else None,
        "student_register_number": record.student.register_number if record.student else None,
        "reporter_name": reporter_name,
        "reporter_role": record.reported_by.role if record.reported_by else None
    }

@router.post("/", response_model=DisciplineResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    record_in: DisciplineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new discipline record. 
    Accessible by Admin, Higher Authority, HOD, and Faculty.
    Students cannot create discipline records.
    """
    if current_user.role == "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students cannot report discipline incidents")

    student = db.query(Student).filter(Student.id == record_in.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    new_record = DisciplineRecord(
        student_id=record_in.student_id,
        reported_by_id=current_user.id,
        incident_type=record_in.incident_type,
        incident_date=record_in.incident_date or date.today(),
        remarks=record_in.remarks,
        action_taken=record_in.action_taken,
        is_locked=True  # Automatically locked upon creation
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return _serialize_record(new_record)


@router.get("/", response_model=List[DisciplineResponse])
def get_records(
    department_id: Optional[int] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get discipline records based on role.
    Admin & Higher Auth: View all (or filter by dept).
    HOD: View all in their dept.
    Faculty: View all in their dept (or specific assigned).
    Student: View only their own.
    """
    query = db.query(DisciplineRecord).join(Student)
    
    if current_user.role == "student":
        # Students can only view their own
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []
        query = query.filter(DisciplineRecord.student_id == student.id)
    
    elif current_user.role == "hod" or current_user.role == "faculty":
        # Usually filter by their own department
        if current_user.faculty_profile and current_user.faculty_profile.department_id:
            query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
            
    if department_id and current_user.role in ["admin", "authority"]:
        query = query.filter(Student.department_id == department_id)
        
    if student_id and current_user.role != "student":
        query = query.filter(DisciplineRecord.student_id == student_id)
        
    records = query.order_by(DisciplineRecord.created_at.desc()).all()
    return [_serialize_record(r) for r in records]


@router.put("/{record_id}", response_model=DisciplineResponse)
def update_record(
    record_id: int,
    record_in: DisciplineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Edit a discipline record.
    ONLY Admins can edit locked records.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admins can edit discipline records")
        
    record = db.query(DisciplineRecord).filter(DisciplineRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        
    if record_in.incident_type is not None:
        record.incident_type = record_in.incident_type
    if record_in.incident_date is not None:
        record.incident_date = record_in.incident_date
    if record_in.remarks is not None:
        record.remarks = record_in.remarks
    if record_in.action_taken is not None:
        record.action_taken = record_in.action_taken
    if record_in.is_locked is not None:
        record.is_locked = record_in.is_locked
        
    db.commit()
    db.refresh(record)
    return _serialize_record(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a discipline record.
    ONLY Admins can delete.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admins can delete discipline records")
        
    record = db.query(DisciplineRecord).filter(DisciplineRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        
    db.delete(record)
    db.commit()


@router.get("/analytics", response_model=DisciplineAnalytics)
def get_analytics(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get Discipline Analytics.
    Admin & Authority get overall (unless department_id is passed).
    HOD gets their own department automatically.
    """
    query = db.query(DisciplineRecord).join(Student)
    
    if current_user.role == "hod":
        if current_user.faculty_profile and current_user.faculty_profile.department_id:
            query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
    elif department_id:
        query = query.filter(Student.department_id == department_id)
        
    total = query.count()
    
    # Category Distribution
    cat_dist = db.query(
        DisciplineRecord.incident_type, 
        func.count(DisciplineRecord.id)
    ).join(Student)
    
    if current_user.role == "hod" and current_user.faculty_profile and current_user.faculty_profile.department_id:
        cat_dist = cat_dist.filter(Student.department_id == current_user.faculty_profile.department_id)
    elif department_id:
        cat_dist = cat_dist.filter(Student.department_id == department_id)
        
    cat_dist = cat_dist.group_by(DisciplineRecord.incident_type).all()
    categories = [CategoryCount(category=str(c[0].value), count=c[1]) for c in cat_dist]
    
    # Trend (Last 7 Days)
    today = date.today()
    trends = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        
        q_trend = db.query(DisciplineRecord).join(Student).filter(
            func.date(DisciplineRecord.incident_date) == target_date
        )
        if current_user.role == "hod" and current_user.faculty_profile and current_user.faculty_profile.department_id:
            q_trend = q_trend.filter(Student.department_id == current_user.faculty_profile.department_id)
        elif department_id:
            q_trend = q_trend.filter(Student.department_id == department_id)
            
        count = q_trend.count()
        trends.append(TrendPoint(period=target_date.strftime("%b %d"), count=count))

    return DisciplineAnalytics(
        total_incidents=total,
        category_distribution=categories,
        recent_trend=trends
    )
