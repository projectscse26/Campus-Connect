from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user as get_current_user
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.leave import FacultyLeaveRequest, FacultyDutyArrangement, FacultyLeaveBalance, LeaveStatus, ArrangementStatus
from app.models.academic import CourseAssignment, Course, Section
from app.models.lms import TimetableSlot, DayOfWeek
from app.models.department import Department
from app.schemas.leave import FacultyLeaveRequestCreate, FacultyLeaveRequestResponse, FacultyDutyArrangementResponse, FacultyLeaveBalanceResponse

router = APIRouter()

@router.get("/leave-preparation-data")
def get_leave_preparation_data(
    from_date: str,
    to_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all data needed for faculty to prepare leave request:
    1. Their timetable slots for the leave period
    2. All other faculty who can substitute
    3. Class advisor responsibilities if any
    """
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can access this")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    from datetime import datetime, timedelta
    
    # Parse dates
    start_date = datetime.strptime(from_date, "%Y-%m-%d").date()
    end_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    
    # Get day names for the leave period
    day_names = []
    current = start_date
    while current <= end_date:
        day_name = current.strftime("%a").lower()[:3]  # mon, tue, wed, etc.
        if day_name not in day_names and day_name in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']:
            day_names.append(day_name)
        current += timedelta(days=1)
    
    # Get faculty's timetable slots for those days
    my_assignments = db.query(CourseAssignment).filter(
        CourseAssignment.faculty_id == faculty.id,
        CourseAssignment.is_active == True
    ).all()
    
    assignment_ids = [a.id for a in my_assignments]
    
    timetable_slots = db.query(TimetableSlot).filter(
        TimetableSlot.course_assignment_id.in_(assignment_ids),
        TimetableSlot.day.in_(day_names)
    ).all()
    
    # Build timetable data with course and section info
    my_schedule = []
    for slot in timetable_slots:
        assignment = db.query(CourseAssignment).filter(CourseAssignment.id == slot.course_assignment_id).first()
        if assignment:
            course = db.query(Course).filter(Course.id == assignment.course_id).first()
            section = db.query(Section).filter(Section.id == assignment.section_id).first()
            department = db.query(Department).filter(Department.id == section.department_id).first() if section else None
            
            if course and section:
                my_schedule.append({
                    "slot_id": slot.id,
                    "assignment_id": assignment.id,
                    "day": slot.day,
                    "start_time": slot.start_time.strftime("%H:%M") if slot.start_time else "",
                    "end_time": slot.end_time.strftime("%H:%M") if slot.end_time else "",
                    "room": slot.room,
                    "course_code": course.code,
                    "course_name": course.name,
                    "course_short_name": course.short_name or course.code,
                    "section_name": section.name,
                    "year": section.year,
                    "department_short": department.code if department else "DEPT",
                    "class_section": f"{department.code if department else 'Dept'} Year-{section.year} {section.name}",
                    "period_display": f"{slot.start_time.strftime('%H:%M') if slot.start_time else ''} - {slot.end_time.strftime('%H:%M') if slot.end_time else ''}",
                    "_section_id": section.id,
                    "_start_time": slot.start_time,
                    "_end_time": slot.end_time
                })
    
    # Get all other active faculty (excluding current faculty)
    all_other_faculty = db.query(Faculty).filter(
        Faculty.id != faculty.id,
        Faculty.is_active == True
    ).all()
    
    faculty_list = []
    for f in all_other_faculty:
        dept = db.query(Department).filter(Department.id == f.department_id).first()
        faculty_list.append({
            "id": f.id,
            "name": f"{f.first_name} {f.last_name}",
            "designation": f.designation,
            "department": dept.name if dept else "N/A"
        })
        
    # Pre-fetch data for substitute filtering
    other_faculty_ids = [f["id"] for f in faculty_list]
    active_assignments = db.query(CourseAssignment).filter(
        CourseAssignment.faculty_id.in_(other_faculty_ids),
        CourseAssignment.is_active == True
    ).all()
    
    faculty_sections = {}
    for a in active_assignments:
        if a.faculty_id not in faculty_sections:
            faculty_sections[a.faculty_id] = set()
        faculty_sections[a.faculty_id].add(a.section_id)
        
    assignment_to_faculty = {a.id: a.faculty_id for a in active_assignments}
    all_slots = db.query(TimetableSlot).filter(
        TimetableSlot.course_assignment_id.in_(list(assignment_to_faculty.keys())),
        TimetableSlot.day.in_(day_names)
    ).all()
    
    faculty_busy_slots = {}
    for s in all_slots:
        fid = assignment_to_faculty[s.course_assignment_id]
        if fid not in faculty_busy_slots:
            faculty_busy_slots[fid] = []
        faculty_busy_slots[fid].append(s)

    # Compute available_substitutes for my_schedule
    for item in my_schedule:
        item["available_substitutes"] = []
        target_section_id = item.get("_section_id")
        for f in faculty_list:
            fid = f["id"]
            # Check overlap
            is_busy = False
            if fid in faculty_busy_slots:
                for bs in faculty_busy_slots[fid]:
                    if bs.day == item["day"]:
                        if bs.start_time and bs.end_time and item.get("_start_time") and item.get("_end_time"):
                            if bs.start_time < item["_end_time"] and bs.end_time > item["_start_time"]:
                                is_busy = True
                                break
            
            if not is_busy:
                teaches_class = target_section_id in faculty_sections.get(fid, set())
                sub_info = dict(f)
                sub_info["teaches_this_class"] = teaches_class
                item["available_substitutes"].append(sub_info)
                
        # Sort so those who teach class appear first
        item["available_substitutes"].sort(key=lambda x: not x["teaches_this_class"])
        
        # Remove internal fields
        item.pop("_section_id", None)
        item.pop("_start_time", None)
        item.pop("_end_time", None)

    # Check if current faculty is a class advisor
    advised_sections = db.query(Section).filter(
        Section.class_advisor_id == faculty.id,
        Section.is_active == True
    ).all()
    
    class_advisor_duties = []
    for sec in advised_sections:
        dept = db.query(Department).filter(Department.id == sec.department_id).first()
        
        # Compute available_substitutes for class advisor
        available_subs = []
        for f in faculty_list:
            fid = f["id"]
            teaches_class = sec.id in faculty_sections.get(fid, set())
            sub_info = dict(f)
            sub_info["teaches_this_class"] = teaches_class
            available_subs.append(sub_info)
        available_subs.sort(key=lambda x: not x["teaches_this_class"])
        
        class_advisor_duties.append({
            "section_id": sec.id,
            "section_name": sec.name,
            "year": sec.year,
            "batch": sec.batch,
            "department": dept.name if dept else "N/A",
            "class_display": f"{dept.code if dept else 'Dept'} Year-{sec.year} {sec.name}",
            "duty_type": "Class Advisor",
            "available_substitutes": available_subs
        })
    
    return {
        "my_schedule": my_schedule,
        "available_faculty": faculty_list,
        "class_advisor_duties": class_advisor_duties,
        "total_periods_to_cover": len(my_schedule),
        "requires_class_advisor_substitute": len(class_advisor_duties) > 0
    }

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
        
    import datetime
    today = datetime.date.today()
    
    # 1. Casual Leave used in current month
    start_of_month = datetime.date(today.year, today.month, 1)
    if today.month == 12:
        end_of_month = datetime.date(today.year + 1, 1, 1)
    else:
        end_of_month = datetime.date(today.year, today.month + 1, 1)
        
    monthly_casual_reqs = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.faculty_id == faculty.id,
        FacultyLeaveRequest.leave_type == "Casual Leave",
        FacultyLeaveRequest.status == LeaveStatus.APPROVED,
        FacultyLeaveRequest.from_date >= start_of_month,
        FacultyLeaveRequest.from_date < end_of_month
    ).all()
    casual_used_this_month = sum(r.duration_days for r in monthly_casual_reqs)
    
    # 2. Restricted Leave used in current semester (Jan-Jun or Jul-Dec)
    if today.month <= 6:
        start_of_sem = datetime.date(today.year, 1, 1)
        end_of_sem = datetime.date(today.year, 7, 1)
    else:
        start_of_sem = datetime.date(today.year, 7, 1)
        end_of_sem = datetime.date(today.year + 1, 1, 1)
        
    sem_restricted_reqs = db.query(FacultyLeaveRequest).filter(
        FacultyLeaveRequest.faculty_id == faculty.id,
        FacultyLeaveRequest.leave_type == "Restricted Leave",
        FacultyLeaveRequest.status == LeaveStatus.APPROVED,
        FacultyLeaveRequest.from_date >= start_of_sem,
        FacultyLeaveRequest.from_date < end_of_sem
    ).all()
    restricted_used_this_sem = sum(r.duration_days for r in sem_restricted_reqs)
    # 3. Earned Leave total (accrued 1 per completed month since June)
    completed_months = today.month - 6 if today.month >= 6 else today.month + 6

    return {
        "id": balance.id,
        "faculty_id": balance.faculty_id,
        "academic_year": balance.academic_year,
        "casual_leaves_total": 1,
        "casual_leaves_used": int(min(casual_used_this_month, 1)),
        "restricted_leaves_total": 1,
        "restricted_leaves_used": int(min(restricted_used_this_sem, 1)),
        "sick_leaves_total": balance.sick_leaves_total,
        "sick_leaves_used": balance.sick_leaves_used,
        "earned_leaves_total": int(completed_months),
        "earned_leaves_used": balance.earned_leaves_used,
        "vacation_leaves_total": balance.vacation_leaves_total,
        "vacation_leaves_used": balance.vacation_leaves_used,
        "compensation_leaves_total": balance.compensation_leaves_total,
        "compensation_leaves_used": balance.compensation_leaves_used,
        "academic_leaves_total": balance.academic_leaves_total,
        "academic_leaves_used": balance.academic_leaves_used
    }

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

    # Validate that arrangements are provided
    if not request.arrangements or len(request.arrangements) == 0:
        raise HTTPException(status_code=400, detail="At least one substitute arrangement must be provided")

    # Create the request with PENDING_SUBSTITUTE status
    # It will only move to PENDING_HOD after all substitutes accept
    leave_req = FacultyLeaveRequest(
        faculty_id=faculty.id,
        leave_type=request.leave_type,
        from_date=request.from_date,
        to_date=request.to_date,
        duration_days=duration,
        reason=request.reason,
        attachment_url=request.attachment_url,
        status=LeaveStatus.PENDING_SUBSTITUTE
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
            period=arr.period,
            status=ArrangementStatus.PENDING
        )
        db.add(duty)
        
    db.commit()
    db.refresh(leave_req)
    
    return get_leave_request_detail(leave_req.id, db)

@router.put("/requests/{request_id}/withdraw")
def withdraw_leave_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Only faculty can withdraw their own requests")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    req = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id == request_id, FacultyLeaveRequest.faculty_id == faculty.id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not owned by you")
        
    if req.status in [LeaveStatus.APPROVED, LeaveStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Cannot withdraw already processed requests")
    
    # Can withdraw any pending request (PENDING_SUBSTITUTE, PENDING_HOD, PENDING_DEAN, PENDING_OM)
    db.query(FacultyDutyArrangement).filter(FacultyDutyArrangement.leave_request_id == request_id).delete()
    db.delete(req)
    db.commit()
    return {"message": "Request withdrawn and deleted successfully"}

@router.put("/requests/{request_id}", response_model=FacultyLeaveRequestResponse)
def update_leave_request(
    request_id: int,
    request: FacultyLeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(status_code=403, detail="Access denied")
        
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    leave_req = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id == request_id, FacultyLeaveRequest.faculty_id == faculty.id).first()
    
    if not leave_req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if leave_req.status in [LeaveStatus.APPROVED, LeaveStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Processed requests cannot be modified")
        
    # Only allow edits if still in PENDING_SUBSTITUTE state
    if leave_req.status != LeaveStatus.PENDING_SUBSTITUTE:
        raise HTTPException(status_code=400, detail="Cannot modify request after substitute approval has started")
        
    duration = (request.to_date - request.from_date).days + 1
    if duration <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range")
    
    # Validate that arrangements are provided
    if not request.arrangements or len(request.arrangements) == 0:
        raise HTTPException(status_code=400, detail="At least one substitute arrangement must be provided")
        
    leave_req.leave_type = request.leave_type
    leave_req.from_date = request.from_date
    leave_req.to_date = request.to_date
    leave_req.duration_days = duration
    leave_req.reason = request.reason
    leave_req.attachment_url = request.attachment_url
    leave_req.status = LeaveStatus.PENDING_SUBSTITUTE
    
    db.query(FacultyDutyArrangement).filter(FacultyDutyArrangement.leave_request_id == request_id).delete()
    
    for arr in request.arrangements:
        duty = FacultyDutyArrangement(
            leave_request_id=leave_req.id,
            substitute_faculty_id=arr.substitute_faculty_id,
            subject=arr.subject,
            class_section=arr.class_section,
            period=arr.period,
            status=ArrangementStatus.PENDING
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
        elif "hr" in auth.title.lower():
            # HR sees all leaves
            pass
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
    response_data = []
    for req in requests:
        fac = db.query(Faculty).filter(Faculty.id == req.faculty_id).first()
        req_dict = {
            "id": req.id,
            "faculty_id": req.faculty_id,
            "leave_type": req.leave_type,
            "from_date": req.from_date,
            "to_date": req.to_date,
            "duration_days": req.duration_days,
            "reason": req.reason,
            "attachment_url": req.attachment_url,
            "status": req.status,
            "hod_approved_by": req.hod_approved_by,
            "dean_approved_by": req.dean_approved_by,
            "om_approved_by": req.om_approved_by,
            "rejection_reason": req.rejection_reason,
            "faculty_name": f"{fac.first_name} {fac.last_name}" if fac else "Unknown",
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "arrangements": []
        }
        
        for arr in req.arrangements:
            if arr.substitute_faculty_id == faculty.id:
                sub = db.query(Faculty).filter(Faculty.id == arr.substitute_faculty_id).first()
                arr_dict = {
                    "id": arr.id,
                    "leave_request_id": arr.leave_request_id,
                    "substitute_faculty_id": arr.substitute_faculty_id,
                    "subject": arr.subject,
                    "class_section": arr.class_section,
                    "period": arr.period,
                    "status": arr.status,
                    "substitute_faculty_name": f"{sub.first_name} {sub.last_name}" if sub else "Unknown",
                    "created_at": arr.created_at,
                    "updated_at": arr.updated_at
                }
                req_dict["arrangements"].append(arr_dict)
                
        if req_dict["arrangements"]:
            response_data.append(req_dict)
            
    return response_data

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
        
    if arr.status != ArrangementStatus.PENDING:
        raise HTTPException(status_code=400, detail="This arrangement has already been processed")
        
    if status.lower() == "accepted":
        arr.status = ArrangementStatus.ACCEPTED
    elif status.lower() == "rejected":
        arr.status = ArrangementStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    db.commit()
    
    # Check if all arrangements for the request are accepted
    req = db.query(FacultyLeaveRequest).filter(FacultyLeaveRequest.id == arr.leave_request_id).first()
    
    # If any arrangement is rejected, reject the entire leave request
    any_rejected = any(a.status == ArrangementStatus.REJECTED for a in req.arrangements)
    
    if any_rejected:
        req.status = LeaveStatus.REJECTED
        req.rejection_reason = "One or more substitute faculty rejected the duty arrangement."
        db.commit()
        return {"message": "Arrangement rejected. Leave request has been rejected."}
    
    # Only move to PENDING_HOD if ALL arrangements are accepted
    all_accepted = all(a.status == ArrangementStatus.ACCEPTED for a in req.arrangements)
    
    if all_accepted and req.status == LeaveStatus.PENDING_SUBSTITUTE:
        req.status = LeaveStatus.PENDING_HOD
        db.commit()
        return {"message": "All substitutes have accepted. Leave request forwarded to HOD for approval."}
        
    return {"message": "Status updated successfully. Waiting for other substitute approvals."}

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
            balance = db.query(FacultyLeaveBalance).filter(FacultyLeaveBalance.faculty_id == req.faculty_id, FacultyLeaveBalance.academic_year == academic_year).first()
            if balance:
                ltype = req.leave_type.lower()
                if "casual" in ltype:
                    balance.casual_leaves_used += req.duration_days
                elif "restricted" in ltype or "rh" in ltype:
                    balance.restricted_leaves_used += req.duration_days
                elif "earned" in ltype:
                    balance.earned_leaves_used += req.duration_days
                elif "vacation" in ltype:
                    balance.vacation_leaves_used += req.duration_days
                elif "compensation" in ltype:
                    balance.compensation_leaves_used += req.duration_days
                elif "academic" in ltype or "od" in ltype or "duty" in ltype:
                    balance.academic_leaves_used += req.duration_days
                elif "sick" in ltype or "medical" in ltype:
                    balance.sick_leaves_used += req.duration_days
    else:
        raise HTTPException(status_code=403, detail="Not authorized to approve at this stage")
        
    db.commit()
    return {"message": "Request approved"}
