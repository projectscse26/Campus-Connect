from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user as get_current_user
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.leave import FacultyLeaveRequest, FacultyDutyArrangement, FacultyLeaveBalance, LeaveStatus, ArrangementStatus
from app.schemas.leave import FacultyLeaveRequestCreate, FacultyLeaveRequestResponse, FacultyDutyArrangementResponse, FacultyLeaveBalanceResponse

router = APIRouter()

@router.get("/balances", response_model=FacultyLeaveBalanceResponse)
def get_leave_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can view leave balances")
    
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
        
    academic_year = "2023-2024" # Default for now
    balance = db.query(FacultyLeaveBalance).filter(
        FacultyLeaveBalance.faculty_id == faculty.id,
        FacultyLeaveBalance.academic_year == academic_year
    ).first()
    
    if not balance:
        # Create default balance
        balance = FacultyLeaveBalance(faculty_id=faculty.id, academic_year=academic_year)
        db.add(balance)
        db.commit()
        db.refresh(balance)
        
    return balance

@router.post("/request", response_model=FacultyLeaveRequestResponse)
def create_leave_request(
    request: FacultyLeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can request leave")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    
    duration = (request.to_date - request.from_date).days + 1
    if duration <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range")

    # Create the request
    leave_req = FacultyLeaveRequest(
        faculty_id=faculty.id,
        leave_type=request.leave_type,
        from_date=request.from_date,
        to_date=request.to_date,
        duration_days=duration,
        reason=request.reason,
        attachment_url=request.attachment_url,
        status=LeaveStatus.PENDING_SUBSTITUTE if request.arrangements else LeaveStatus.PENDING_HOD
    )
    db.add(leave_req)
    db.flush() # Get ID
    
    # Create duty arrangements
    for arr in request.arrangements:
        duty = FacultyDutyArrangement(
            leave_request_id=leave_req.id,
            substitute_faculty_id=arr.substitute_faculty_id,
            subject=arr.subject,
            class_section=arr.class_section,
            period=arr.period
        )
        db.add(duty)
        
    db.commit()
    db.refresh(leave_req)
    
    return get_leave_request_detail(leave_req.id, db)

@router.get("/my-requests", response_model=List[FacultyLeaveRequestResponse])
def get_my_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Access denied")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    
    requests = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.faculty_id == faculty.id).order_by(FacultyLeaveRequest.created_at.desc()).all()
    
    # Attach names
    for req in requests:
        req.faculty_name = f"{faculty.first_name} {faculty.last_name}"
        for arr in req.arrangements:
            sub = db.query(Faculty).filter(Faculty.id == arr.substitute_faculty_id).first()
            arr.substitute_faculty_name = f"{sub.first_name} {sub.last_name}" if sub else "Unknown"
            
    return requests

@router.get("/requests", response_model=List[FacultyLeaveRequestResponse])
def get_all_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Depending on role, filter requests
    if current_user.role not in [UserRole.HOD, UserRole.AUTHORITY]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    query = db.query(FacultyLeaveRequest)
    
    if current_user.role == UserRole.HOD:
        # HOD sees requests pending HOD approval
        query = query.filter(FacultyLeaveRequest.status.in_([LeaveStatus.PENDING_HOD, LeaveStatus.PENDING_DEAN, LeaveStatus.PENDING_OM, LeaveStatus.APPROVED, LeaveStatus.REJECTED]))
    elif current_user.role == UserRole.AUTHORITY:
        # Authority sees requests pending DEAN or OM depending on their title
        from app.models.authority import Authority
        auth = db.query(Authority).filter(Authority.user_id == current_user.id).first()
        if "dean" in auth.title.lower():
            query = query.filter(FacultyLeaveRequest.status.in_([LeaveStatus.PENDING_DEAN, LeaveStatus.PENDING_OM, LeaveStatus.APPROVED, LeaveStatus.REJECTED]))
        else: # OM / Principal
            query = query.filter(FacultyLeaveRequest.status.in_([LeaveStatus.PENDING_OM, LeaveStatus.APPROVED, LeaveStatus.REJECTED]))

    requests = query.order_by(FacultyLeaveRequest.created_at.desc()).all()
    
    for req in requests:
        fac = db.query(Faculty).filter(Faculty.id == req.faculty_id).first()
        req.faculty_name = f"{fac.first_name} {fac.last_name}" if fac else "Unknown"
        for arr in req.arrangements:
            sub = db.query(Faculty).filter(Faculty.id == arr.substitute_faculty_id).first()
            arr.substitute_faculty_name = f"{sub.first_name} {sub.last_name}" if sub else "Unknown"
            
    return requests

@router.get("/requests/{request_id}", response_model=FacultyLeaveRequestResponse)
def get_single_leave_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_leave_request_detail(request_id, db)

def get_leave_request_detail(request_id: int, db: Session):
    req = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    fac = db.query(Faculty).filter(Faculty.id == req.faculty_id).first()
    req.faculty_name = f"{fac.first_name} {fac.last_name}" if fac else "Unknown"
    
    for arr in req.arrangements:
        sub = db.query(Faculty).filter(Faculty.id == arr.substitute_faculty_id).first()
        arr.substitute_faculty_name = f"{sub.first_name} {sub.last_name}" if sub else "Unknown"
        
    return req

@router.get("/substitute-requests", response_model=List[FacultyLeaveRequestResponse])
def get_substitute_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Access denied")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    
    arrangements = db.query(FacultyDutyArrangement).filter(
        FacultyDutyArrangement.substitute_faculty_id == faculty.id,
        FacultyDutyArrangement.status == ArrangementStatus.PENDING
    ).all()
    
    request_ids = list(set([a.leave_request_id for a in arrangements]))
    requests = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id.in_(request_ids)).all()
    
    for req in requests:
        fac = db.query(Faculty).filter(Faculty.id == req.faculty_id).first()
        req.faculty_name = f"{fac.first_name} {fac.last_name}" if fac else "Unknown"
        for arr in req.arrangements:
            sub = db.query(Faculty).filter(Faculty.id == arr.substitute_faculty_id).first()
            arr.substitute_faculty_name = f"{sub.first_name} {sub.last_name}" if sub else "Unknown"
            
    return requests

@router.put("/substitute-requests/{arr_id}")
def update_substitute_request(
    arr_id: int,
    status: str, # "accepted" or "rejected"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Access denied")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    
    arr = db.query(FacultyDutyArrangement).filter(
        FacultyDutyArrangement.id == arr_id,
        FacultyDutyArrangement.substitute_faculty_id == faculty.id
    ).first()
    
    if not arr:
        raise HTTPException(status_code=404, detail="Arrangement not found")
        
    if status.lower() == "accepted":
        arr.status = ArrangementStatus.ACCEPTED
    elif status.lower() == "rejected":
        arr.status = ArrangementStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    db.commit()
    
    # Check if all arrangements for the request are accepted
    req = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id == arr.leave_request_id).first()
    all_accepted = all(a.status == ArrangementStatus.ACCEPTED for a in req.arrangements)
    any_rejected = any(a.status == ArrangementStatus.REJECTED for a in req.arrangements)
    
    if any_rejected:
        req.status = LeaveStatus.REJECTED
        req.rejection_reason = "Substitute faculty rejected the duty arrangement."
        db.commit()
    elif all_accepted and req.status == LeaveStatus.PENDING_SUBSTITUTE:
        req.status = LeaveStatus.PENDING_HOD
        db.commit()
        
    return {"message": "Status updated successfully"}

@router.put("/requests/{request_id}/approve")
def approve_leave_request(
    request_id: int,
    action: str, # "approve" or "reject"
    reason: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if action.lower() == "reject":
        req.status = LeaveStatus.REJECTED
        req.rejection_reason = reason or "Rejected by authority"
        db.commit()
        return {"message": "Request rejected"}
        
    if current_user.role == UserRole.HOD and req.status == LeaveStatus.PENDING_HOD:
        fac = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        req.status = LeaveStatus.PENDING_DEAN
        req.hod_approved_by = fac.id
    elif current_user.role == UserRole.AUTHORITY:
        from app.models.authority import Authority
        auth = db.query(Authority).filter(Authority.user_id == current_user.id).first()
        if "dean" in auth.title.lower() and req.status == LeaveStatus.PENDING_DEAN:
            req.status = LeaveStatus.PENDING_OM
            req.dean_approved_by = auth.id
        elif req.status == LeaveStatus.PENDING_OM:
            req.status = LeaveStatus.APPROVED
            req.om_approved_by = auth.id
            
            # Deduct leave balance
            academic_year = "2023-2024"
            balance = db.query(LeaveBalance).filter(LeaveBalance.faculty_id == req.faculty_id, LeaveBalance.academic_year == academic_year).first()
            if balance:
                if "casual" in req.leave_type.lower():
                    balance.casual_leaves_used += req.duration_days
                elif "sick" in req.leave_type.lower() or "medical" in req.leave_type.lower():
                    balance.sick_leaves_used += req.duration_days
                else:
                    balance.earned_leaves_used += req.duration_days
    else:
        raise HTTPException(status_code=403, detail="Not authorized to approve at this stage")
        
    db.commit()
    return {"message": "Request approved"}
