from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, date

class FacultyBase(BaseModel):
    first_name: str
    last_name: str
    department_id: int
    employee_id: str
    college_email: str
    phone: str
    designation: Optional[str] = None
    specialization: Optional[str] = None
    gender: Optional[str] = None
    joining_date: Optional[date] = None

class FacultyCreate(FacultyBase):
    # Initial password for the user account
    password: str

class FacultyUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department_id: Optional[int] = None
    employee_id: Optional[str] = None
    college_email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    specialization: Optional[str] = None
    gender: Optional[str] = None
    is_active: Optional[bool] = None

class FacultyResponse(FacultyBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class SimpleCourse(BaseModel):
    id: int
    code: str
    name: str
    credits: int
    course_type: str
    short_name: Optional[str] = None

class SimpleSection(BaseModel):
    id: int
    name: str
    year: int
    batch: str

class CourseAssignmentFacultyResponse(BaseModel):
    id: int
    course_id: int
    section_id: int
    academic_year: str
    semester: int
    is_active: bool
    created_at: datetime
    course: Optional[SimpleCourse] = None
    section: Optional[SimpleSection] = None

    model_config = ConfigDict(from_attributes=True)

class LMSResourceCreate(BaseModel):
    title: str
    module_unit: str
    category: str
    description: str
    external_link: Optional[str] = None

class LMSResourceResponse(BaseModel):
    id: int
    course_id: int
    uploaded_by_id: int
    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: Optional[str] = None
    external_link: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_global: Optional[bool] = False

class AnnouncementResponse(BaseModel):
    id: int
    course_id: Optional[int] = None
    department_id: Optional[int] = None
    posted_by_id: int
    title: str
    content: str
    is_global: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
