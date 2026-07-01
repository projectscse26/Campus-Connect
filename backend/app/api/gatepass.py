from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.authority import Authority
from app.models.academic import MentorAssignment
from app.models.gatepass import GatePass, GatePassStatus
from app.schemas.gatepass import GatePassCreate, GatePassResponse, GatePassAction

router = APIRouter()

def get_student_profile(db: Session, user_id: int) -> Student:
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

def get_faculty_profile(db: Session, user_id: int) -> Faculty:
    faculty = db.query(Faculty).filter(Faculty.user_id == user_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return faculty

def get_authority_profile(db: Session, user_id: int) -> Authority:
    authority = db.query(Authority).filter(Authority.user_id == user_id).first()
    if not authority:
        raise HTTPException(status_code=404, detail="Authority profile not found")
    return authority

@router.post("/request", response_model=GatePassResponse)
def request_gatepass(
    gatepass_in: GatePassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Student raises a new Gate Pass."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can raise gate passes")
    
    student = get_student_profile(db, current_user.id)
    
    gatepass = GatePass(
        student_id=student.id,
        reason=gatepass_in.reason,
        out_time=gatepass_in.out_time,
        expected_in_time=gatepass_in.expected_in_time,
        status=GatePassStatus.PENDING_MENTOR
    )
    db.add(gatepass)
    db.commit()
    db.refresh(gatepass)
    return gatepass

@router.get("/me", response_model=List[GatePassResponse])
def get_my_gatepasses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Student fetches their gate pass history."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view their gate passes")
    
    student = get_student_profile(db, current_user.id)
    return db.query(GatePass).options(
        joinedload(GatePass.student),
        joinedload(GatePass.mentor),
        joinedload(GatePass.hod),
        joinedload(GatePass.om)
    ).filter(
        GatePass.student_id == student.id,
        GatePass.is_deleted_by_student == False
    ).order_by(GatePass.created_at.desc()).all()

@router.get("/mentor", response_model=List[GatePassResponse])
def get_mentor_gatepasses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mentor fetches pending gate passes from their mentees."""
    if current_user.role not in [UserRole.FACULTY, UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Only faculty can view mentee gate passes")
    
    faculty = get_faculty_profile(db, current_user.id)
    
    # Get all students where this faculty is the mentor
    mentees = db.query(MentorAssignment.student_id).filter(
        MentorAssignment.mentor_id == faculty.id
    ).subquery()
    
    return db.query(GatePass).options(
        joinedload(GatePass.student)
    ).filter(
        GatePass.student_id.in_(mentees),
        GatePass.status == GatePassStatus.PENDING_MENTOR,
        GatePass.is_deleted_by_student == False
    ).order_by(GatePass.created_at.desc()).all()

@router.get("/hod", response_model=List[GatePassResponse])
def get_hod_gatepasses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """HOD fetches pending gate passes from students in their department."""
    if current_user.role != UserRole.HOD:
        raise HTTPException(status_code=403, detail="Only HODs can view department gate passes")
    
    faculty = get_faculty_profile(db, current_user.id)
    
    return db.query(GatePass).join(Student).options(
        joinedload(GatePass.student)
    ).filter(
        Student.department_id == faculty.department_id,
        GatePass.status == GatePassStatus.PENDING_HOD,
        GatePass.is_deleted_by_student == False
    ).order_by(GatePass.created_at.desc()).all()

@router.get("/om", response_model=List[GatePassResponse])
def get_om_gatepasses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """OM fetches pending gate passes for the whole college."""
    if current_user.role != UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Only Authorities can view OM gate passes")
    
    return db.query(GatePass).options(
        joinedload(GatePass.student)
    ).filter(
        GatePass.status == GatePassStatus.PENDING_OM,
        GatePass.is_deleted_by_student == False
    ).order_by(GatePass.created_at.desc()).all()

@router.put("/{gatepass_id}/approve", response_model=GatePassResponse)
def approve_gatepass(
    gatepass_id: int,
    action: GatePassAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Unified endpoint to approve or reject a gate pass."""
    gatepass = db.query(GatePass).filter(GatePass.id == gatepass_id).first()
    if not gatepass:
        raise HTTPException(status_code=404, detail="Gate pass not found")
        
    is_reject = action.status == "reject"
    now = datetime.utcnow()
    
    if current_user.role in [UserRole.FACULTY, UserRole.HOD] and gatepass.status == GatePassStatus.PENDING_MENTOR:
        faculty = get_faculty_profile(db, current_user.id)
        if is_reject:
            gatepass.status = GatePassStatus.REJECTED
            gatepass.rejection_reason = action.rejection_reason
        else:
            gatepass.status = GatePassStatus.PENDING_HOD
            gatepass.mentor_id = faculty.id
            gatepass.mentor_approved_at = now
            
    elif current_user.role == UserRole.HOD and gatepass.status == GatePassStatus.PENDING_HOD:
        faculty = get_faculty_profile(db, current_user.id)
        if is_reject:
            gatepass.status = GatePassStatus.REJECTED
            gatepass.rejection_reason = action.rejection_reason
        else:
            gatepass.status = GatePassStatus.PENDING_OM
            gatepass.hod_id = faculty.id
            gatepass.hod_approved_at = now
            
    elif current_user.role == UserRole.AUTHORITY and gatepass.status == GatePassStatus.PENDING_OM:
        authority = get_authority_profile(db, current_user.id)
        if is_reject:
            gatepass.status = GatePassStatus.REJECTED
            gatepass.rejection_reason = action.rejection_reason
        else:
            gatepass.status = GatePassStatus.APPROVED
            gatepass.om_id = authority.id
            gatepass.om_approved_at = now
    else:
        raise HTTPException(status_code=400, detail="Not authorized to perform this action at this stage")
        
    db.commit()
    db.refresh(gatepass)
    
    # Reload with relationships
    return db.query(GatePass).options(
        joinedload(GatePass.student),
        joinedload(GatePass.mentor),
        joinedload(GatePass.hod),
        joinedload(GatePass.om)
    ).filter(GatePass.id == gatepass_id).first()

@router.delete("/{gatepass_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gatepass(
    gatepass_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Student deletes their own gate pass request."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can delete gate passes")
        
    student = get_student_profile(db, current_user.id)
    gatepass = db.query(GatePass).filter(GatePass.id == gatepass_id, GatePass.student_id == student.id).first()
    
    if not gatepass:
        raise HTTPException(status_code=404, detail="Gate pass not found or you don't have permission to delete it")
        
    gatepass.is_deleted_by_student = True
    db.commit()
    return None
