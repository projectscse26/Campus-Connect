from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, date

class SectionSimple(BaseModel):
    name: str
    
    model_config = ConfigDict(from_attributes=True)

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    register_number: str
    college_email: str
    phone: str
    department_id: int
    batch: str                          # e.g. "2023-2027"
    current_semester: int = 1
    current_year: Optional[int] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    aadhar_number: Optional[str] = None
    accommodation: Optional[str] = None
    transportation: Optional[str] = None
    bus_number: Optional[str] = None

class StudentCreate(StudentBase):
    password: str

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    register_number: Optional[str] = None
    college_email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    batch: Optional[str] = None
    current_semester: Optional[int] = None
    current_year: Optional[int] = None
    is_active: Optional[bool] = None
    aadhar_number: Optional[str] = None
    accommodation: Optional[str] = None
    transportation: Optional[str] = None
    bus_number: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    section: Optional[SectionSimple] = None

    model_config = ConfigDict(from_attributes=True)

