from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime


# ── My Class / Dashboard ──────────────────────────────────

class ClassInfoResponse(BaseModel):
    section_id: int
    section_name: str          # "A", "B"
    department_id: int
    department_name: str
    department_code: str
    year: int
    batch: str
    semester: int              # derived: (year-1)*2 + 1
    total_students: int
    advisor_name: str

    model_config = ConfigDict(from_attributes=True)


class CADashboardResponse(BaseModel):
    class_info: ClassInfoResponse
    present_today: int
    absent_today: int
    total_students: int


# ── Student List ──────────────────────────────────────────

class CAStudentListItem(BaseModel):
    id: int
    register_number: str
    roll_number: Optional[str] = None   # same as register_number for now
    first_name: str
    last_name: str
    phone: str
    gender: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ── Student Profile ───────────────────────────────────────

class EnrolledSubject(BaseModel):
    id: int
    code: str
    name: str
    credits: int

    model_config = ConfigDict(from_attributes=True)


class CAStudentProfileResponse(BaseModel):
    id: int
    register_number: str
    first_name: str
    last_name: str
    department_name: str
    department_code: str
    year: int
    semester: Optional[int] = None
    section_name: str
    phone: str
    gender: Optional[str] = None
    overall_attendance_percentage: float
    enrolled_subjects: List[EnrolledSubject]

    model_config = ConfigDict(from_attributes=True)


# ── Daily Attendance ──────────────────────────────────────

class AttendanceStudentRow(BaseModel):
    student_id: int
    register_number: str
    first_name: str
    last_name: str
    status: Optional[str] = None      # "present" | "absent" | None (not marked yet)

    model_config = ConfigDict(from_attributes=True)


class AttendanceMarkItem(BaseModel):
    student_id: int
    status: str    # "present" or "absent"


class AttendanceSaveRequest(BaseModel):
    date: date
    records: List[AttendanceMarkItem]
    course_id: Optional[int] = None
    course_assignment_id: Optional[int] = None
    unit: Optional[str] = None
    topic_id: Optional[int] = None
    hour: Optional[int] = None


class AttendanceSaveResponse(BaseModel):
    message: str
    saved: int


# ── Attendance Summary ────────────────────────────────────

class AttendanceSummaryItem(BaseModel):
    student_id: int
    register_number: str
    first_name: str
    last_name: str
    present_days: int
    total_days: int
    percentage: float

    model_config = ConfigDict(from_attributes=True)


# ── Timetable ─────────────────────────────────────────────

class CATimetableSlot(BaseModel):
    id: int
    day: str
    start_time: str
    end_time: str
    room: Optional[str] = None
    subject_code: str
    subject_name: str
    faculty_name: str

    model_config = ConfigDict(from_attributes=True)


# ── Subjects ──────────────────────────────────────────────

class CASubjectItem(BaseModel):
    course_id: int
    code: str
    name: str
    credits: int
    course_type: str
    faculty_name: str
    course_assignment_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ── Course Progress ───────────────────────────────────────

class CACourseProgressItem(BaseModel):
    course_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    units_completed: int
    total_units: int

    model_config = ConfigDict(from_attributes=True)
