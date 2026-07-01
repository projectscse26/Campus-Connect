from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.gatepass import GatePassStatus

# Shared simple user schema for nesting
class SimpleUserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    
    model_config = ConfigDict(from_attributes=True)

class DepartmentBasicInfo(BaseModel):
    id: int
    name: str
    code: str
    
    model_config = ConfigDict(from_attributes=True)

class StudentBasicInfo(SimpleUserBase):
    register_number: str
    current_year: Optional[int] = None
    department: Optional[DepartmentBasicInfo] = None

class GatePassCreate(BaseModel):
    reason: str
    out_time: datetime
    expected_in_time: Optional[datetime] = None

class GatePassAction(BaseModel):
    status: str # "approve" or "reject"
    rejection_reason: Optional[str] = None

class GatePassResponse(BaseModel):
    id: int
    student_id: int
    reason: str
    out_time: datetime
    expected_in_time: Optional[datetime] = None
    actual_in_time: Optional[datetime] = None
    status: GatePassStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Audit trail
    mentor_id: Optional[int] = None
    mentor_approved_at: Optional[datetime] = None
    hod_id: Optional[int] = None
    hod_approved_at: Optional[datetime] = None
    om_id: Optional[int] = None
    om_approved_at: Optional[datetime] = None
    
    # Nested relations
    student: Optional[StudentBasicInfo] = None
    mentor: Optional[SimpleUserBase] = None
    hod: Optional[SimpleUserBase] = None
    om: Optional[SimpleUserBase] = None

    model_config = ConfigDict(from_attributes=True)
