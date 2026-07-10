from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user as get_current_user
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.authority import Authority
from app.models.department import Department
from app.models.gatepass import FacultyGatePass, FacultyGatePassStatus
from app.schemas.faculty_gatepass import FacultyGatePassCreate, FacultyGatePassResponse, FacultyGatePassAction

router = APIRouter()

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


@router.post("/", response_model=FacultyGatePassResponse)
def create_faculty_gatepass(
    request: FacultyGatePassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can create faculty gate passes")
        
    faculty = get_faculty_profile(db, current_user.id)
    
    new_gp = FacultyGatePass(
        faculty_id=faculty.id,
        reason=request.reason,
        out_time=request.out_time,
        expected_in_time=request.expected_in_time,
        status=FacultyGatePassStatus.PENDING_HOD
    )
    db.add(new_gp)
    db.commit()
    db.refresh(new_gp)
    
    # Reload with relationships
    return db.query(FacultyGatePass).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department)
    ).filter(FacultyGatePass.id == new_gp.id).first()


@router.get("/me", response_model=List[FacultyGatePassResponse])
def get_my_gatepasses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can view their gate passes")
        
    faculty = get_faculty_profile(db, current_user.id)
    
    return db.query(FacultyGatePass).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department),
        joinedload(FacultyGatePass.hod_approver),
        joinedload(FacultyGatePass.dean),
        joinedload(FacultyGatePass.om)
    ).filter(
        FacultyGatePass.faculty_id == faculty.id,
        FacultyGatePass.is_deleted_by_faculty == False
    ).order_by(FacultyGatePass.created_at.desc()).all()


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty_gatepass(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can delete their gate passes")
        
    faculty = get_faculty_profile(db, current_user.id)
    
    gp = db.query(FacultyGatePass).filter(
        FacultyGatePass.id == id,
        FacultyGatePass.faculty_id == faculty.id
    ).first()
    
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found")
        
    gp.is_deleted_by_faculty = True
    db.commit()
    return None


@router.get("/hod-queue", response_model=List[FacultyGatePassResponse])
def get_hod_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.HOD:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    faculty = get_faculty_profile(db, current_user.id)
    
    # Check if HOD
    department = db.query(Department).filter(Department.hod_id == faculty.id).first()
    if not department:
        raise HTTPException(status_code=403, detail="Only HOD can view this queue")
        
    # Get pending requests for this department's faculty
    return db.query(FacultyGatePass).join(Faculty, FacultyGatePass.faculty_id == Faculty.id).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department)
    ).filter(
        Faculty.department_id == department.id,
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_HOD
    ).order_by(FacultyGatePass.created_at.desc()).all()


@router.put("/{id}/hod-approve", response_model=FacultyGatePassResponse)
def hod_approve_gatepass(
    id: int,
    action: FacultyGatePassAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.HOD:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    faculty = get_faculty_profile(db, current_user.id)
    department = db.query(Department).filter(Department.hod_id == faculty.id).first()
    
    if not department:
        raise HTTPException(status_code=403, detail="Only HOD can approve")
        
    gp = db.query(FacultyGatePass).join(Faculty, FacultyGatePass.faculty_id == Faculty.id).filter(
        FacultyGatePass.id == id,
        Faculty.department_id == department.id,
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_HOD
    ).first()
    
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found or not in HOD pending state")
        
    gp.hod_id = faculty.id
    gp.hod_approved_at = datetime.now()
    gp.viewed_by_hod = True
    
    if action.status == "approve":
        gp.status = FacultyGatePassStatus.PENDING_DEAN
    else:
        gp.status = FacultyGatePassStatus.REJECTED
        gp.rejection_reason = action.rejection_reason
        
    db.commit()
    db.refresh(gp)
    return gp


@router.get("/dean-queue", response_model=List[FacultyGatePassResponse])
def get_dean_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    authority = get_authority_profile(db, current_user.id)
    if authority.title.lower().strip() != "dean":
        raise HTTPException(status_code=403, detail="Only Dean can view this queue")
        
    return db.query(FacultyGatePass).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department)
    ).filter(
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_DEAN
    ).order_by(FacultyGatePass.created_at.desc()).all()


@router.put("/{id}/dean-approve", response_model=FacultyGatePassResponse)
def dean_approve_gatepass(
    id: int,
    action: FacultyGatePassAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    authority = get_authority_profile(db, current_user.id)
    if authority.title.lower().strip() != "dean":
        raise HTTPException(status_code=403, detail="Only Dean can approve")
        
    gp = db.query(FacultyGatePass).filter(
        FacultyGatePass.id == id,
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_DEAN
    ).first()
    
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found or not in Dean pending state")
        
    gp.dean_id = authority.id
    gp.dean_approved_at = datetime.now()
    gp.viewed_by_dean = True
    
    if action.status == "approve":
        gp.status = FacultyGatePassStatus.PENDING_OM
    else:
        gp.status = FacultyGatePassStatus.REJECTED
        gp.rejection_reason = action.rejection_reason
        
    db.commit()
    db.refresh(gp)
    return gp


@router.get("/om-queue", response_model=List[FacultyGatePassResponse])
def get_om_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    authority = get_authority_profile(db, current_user.id)
    if authority.title.lower().strip() != "office manager":
        raise HTTPException(status_code=403, detail="Only OM can view this queue")
        
    return db.query(FacultyGatePass).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department)
    ).filter(
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_OM
    ).order_by(FacultyGatePass.created_at.desc()).all()


@router.put("/{id}/om-approve", response_model=FacultyGatePassResponse)
def om_approve_gatepass(
    id: int,
    action: FacultyGatePassAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    authority = get_authority_profile(db, current_user.id)
    if authority.title.lower().strip() != "office manager":
        raise HTTPException(status_code=403, detail="Only OM can approve")
        
    gp = db.query(FacultyGatePass).filter(
        FacultyGatePass.id == id,
        FacultyGatePass.status == FacultyGatePassStatus.PENDING_OM
    ).first()
    
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found or not in OM pending state")
        
    gp.om_id = authority.id
    gp.om_approved_at = datetime.now()
    gp.viewed_by_om = True
    
    if action.status == "approve":
        gp.status = FacultyGatePassStatus.APPROVED
    else:
        gp.status = FacultyGatePassStatus.REJECTED
        gp.rejection_reason = action.rejection_reason
        
    db.commit()
    db.refresh(gp)
    return gp


@router.get("/tracking", response_model=List[FacultyGatePassResponse])
def get_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Dean and OM can see all tracking
    if current_user.role != UserRole.AUTHORITY:
        raise HTTPException(status_code=403, detail="Only authorities can view global tracking")
        
    return db.query(FacultyGatePass).options(
        joinedload(FacultyGatePass.faculty).joinedload(Faculty.department),
        joinedload(FacultyGatePass.hod_approver),
        joinedload(FacultyGatePass.dean),
        joinedload(FacultyGatePass.om)
    ).order_by(FacultyGatePass.created_at.desc()).all()


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty_gatepass(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can delete gate passes")
        
    faculty = get_faculty_profile(db, current_user.id)
    
    gp = db.query(FacultyGatePass).filter(
        FacultyGatePass.id == id,
        FacultyGatePass.faculty_id == faculty.id
    ).first()
    
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found")
        
    gp.is_deleted_by_faculty = True
    db.commit()
    return None

