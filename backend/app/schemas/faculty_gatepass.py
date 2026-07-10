from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.gatepass import FacultyGatePassStatus

class DepartmentBasicInfo(BaseModel):
    id: int
    name: str
    code: str
    model_config = ConfigDict(from_attributes=True)

class FacultyBasicInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    employee_id: str
    college_email: Optional[str] = None
    department: Optional[DepartmentBasicInfo] = None
    model_config = ConfigDict(from_attributes=True)

class AuthorityBasicInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    title: str
    model_config = ConfigDict(from_attributes=True)

class FacultyGatePassCreate(BaseModel):
    reason: str
    out_time: datetime
    expected_in_time: Optional[datetime] = None

class FacultyGatePassAction(BaseModel):
    status: str # "approve" or "reject"
    rejection_reason: Optional[str] = None

class FacultyGatePassResponse(BaseModel):
    id: int
    faculty_id: int
    reason: str
    out_time: datetime
    expected_in_time: Optional[datetime] = None
    actual_in_time: Optional[datetime] = None
    
    status: FacultyGatePassStatus
    
    viewed_by_hod: bool
    viewed_by_dean: bool
    viewed_by_om: bool
    
    hod_id: Optional[int] = None
    hod_approved_at: Optional[datetime] = None
    
    dean_id: Optional[int] = None
    dean_approved_at: Optional[datetime] = None
    
    om_id: Optional[int] = None
    om_approved_at: Optional[datetime] = None
    
    rejection_reason: Optional[str] = None
    is_deleted_by_faculty: bool
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    faculty: Optional[FacultyBasicInfo] = None
    hod_approver: Optional[FacultyBasicInfo] = None
    dean: Optional[AuthorityBasicInfo] = None
    om: Optional[AuthorityBasicInfo] = None
    
    model_config = ConfigDict(from_attributes=True)
