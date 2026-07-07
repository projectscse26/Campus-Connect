from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    code: str
    vision: Optional[str] = None
    hod_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    hod_id: Optional[int] = None

class DepartmentSettingsUpdate(BaseModel):
    current_sem_start_date: Optional[datetime] = None
    attendance_closed: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: int
    current_sem_start_date: Optional[datetime] = None
    attendance_closed: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
