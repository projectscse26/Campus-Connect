from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# --- Section Schemas ---
class SectionCreate(BaseModel):
    name: str           # A, B, C
    year: int           # 1, 2, 3, 4
    batch: str          # "2023-2027"

class SectionUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None
    batch: Optional[str] = None
    class_advisor_id: Optional[int] = None

class SectionResponse(BaseModel):
    id: int
    department_id: int
    name: str
    year: int
    batch: str
    class_advisor_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AssignStudentsRequest(BaseModel):
    student_ids: list[int]


# --- Course Assignment Schemas ---
class CourseAssignmentCreate(BaseModel):
    faculty_id: int
    course_id: int
    section_id: int
    academic_year: str      # "2024-2025"
    semester: int

class SimpleCourse(BaseModel):
    id: int
    code: str
    name: str
    short_name: Optional[str] = None

class SimpleFaculty(BaseModel):
    id: int
    first_name: str
    last_name: str

class CourseAssignmentResponse(BaseModel):
    id: int
    faculty_id: int
    course_id: int
    section_id: int
    academic_year: str
    semester: int
    is_active: bool
    created_at: datetime
    course: Optional[SimpleCourse] = None
    faculty: Optional[SimpleFaculty] = None

    model_config = ConfigDict(from_attributes=True)

# --- Mentor Assignment Schemas ---
class MentorAssignmentCreate(BaseModel):
    mentor_id: int
    student_id: int
    academic_year: str

class MentorAssignmentResponse(BaseModel):
    id: int
    mentor_id: int
    student_id: int
    academic_year: str
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard KPI ---
class HodDashboardResponse(BaseModel):
    department_name: str
    department_code: str
    faculty_count: int
    student_count: int
    course_count: int
    section_count: int
    assignment_count: int

# --- Timetable Schemas ---
class TimetableSlotCreate(BaseModel):
    course_assignment_id: int
    day: str
    start_time: str
    end_time: str
    room: Optional[str] = None

class TimetableSlotResponse(BaseModel):
    id: int
    course_assignment_id: int
    day: str
    start_time: str
    end_time: str
    room: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TimetableBulkCreate(BaseModel):
    section_id: int
    slots: list[TimetableSlotCreate]

# --- Announcement Schemas ---
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_global: bool = False

class AnnouncementResponse(BaseModel):
    id: int
    department_id: Optional[int]
    posted_by_id: int
    title: str
    content: str
    is_global: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
