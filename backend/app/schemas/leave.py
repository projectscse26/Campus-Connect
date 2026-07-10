from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from app.models.leave import LeaveStatus, ArrangementStatus, StudentLeaveStatus

class FacultyDutyArrangementBase(BaseModel):
    substitute_faculty_id: int
    subject: str
    class_section: str
    period: str

class FacultyDutyArrangementCreate(FacultyDutyArrangementBase):
    pass

class FacultyDutyArrangementResponse(FacultyDutyArrangementBase):
    id: int
    leave_request_id: int
    status: ArrangementStatus
    substitute_faculty_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FacultyLeaveRequestBase(BaseModel):
    leave_type: str
    from_date: date
    to_date: date
    reason: str
    attachment_url: Optional[str] = None

class FacultyLeaveRequestCreate(FacultyLeaveRequestBase):
    arrangements: List[FacultyDutyArrangementCreate] = []

class FacultyLeaveRequestResponse(FacultyLeaveRequestBase):
    id: int
    faculty_id: int
    faculty_name: Optional[str] = None
    duration_days: int
    status: LeaveStatus
    hod_approved_by: Optional[int] = None
    dean_approved_by: Optional[int] = None
    om_approved_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    arrangements: List[FacultyDutyArrangementResponse] = []

    class Config:
        from_attributes = True

class FacultyLeaveBalanceBase(BaseModel):
    academic_year: str
    casual_leaves_total: int
    casual_leaves_used: int
    sick_leaves_total: int
    sick_leaves_used: int
    earned_leaves_total: int
    earned_leaves_used: int
    restricted_leaves_total: int
    restricted_leaves_used: int
    vacation_leaves_total: int
    vacation_leaves_used: int
    compensation_leaves_total: int
    compensation_leaves_used: int
    academic_leaves_total: int
    academic_leaves_used: int

class FacultyLeaveBalanceResponse(FacultyLeaveBalanceBase):
    id: int
    faculty_id: int

    class Config:
        from_attributes = True


# ── Student Leave Schemas ──────────────────────────────────────────────────

class StudentLeaveRequestCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str

class StudentLeaveRequestResponse(BaseModel):
    id: int
    student_id: int
    from_date: date
    to_date: date
    duration_days: int
    reason: str
    status: StudentLeaveStatus

    # Approval trail — order: Mentor → Class Advisor → HOD
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    mentor_remarks: Optional[str] = None
    mentor_actioned_at: Optional[datetime] = None

    class_advisor_id: Optional[int] = None
    class_advisor_name: Optional[str] = None
    class_advisor_remarks: Optional[str] = None
    class_advisor_actioned_at: Optional[datetime] = None

    hod_id: Optional[int] = None
    hod_name: Optional[str] = None
    hod_remarks: Optional[str] = None
    hod_actioned_at: Optional[datetime] = None

    rejection_reason: Optional[str] = None
    viewed_by_mentor: Optional[bool] = False
    viewed_by_ca: Optional[bool] = False
    viewed_by_hod: Optional[bool] = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
