"""
Campus Connect ERP — Central Model Registry

Import all models here so SQLAlchemy's `Base.metadata` sees every table.
Any new model file must be imported in this module.
"""

# Core
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.authority import Authority
from app.models.alumni import Alumni
from app.models.discipline import DisciplineRecord
from app.models.late import LateRecord
from app.models.leave import FacultyLeaveRequest, FacultyDutyArrangement, FacultyLeaveBalance

# Academic
from app.models.academic import (
    Section,
    Course, CourseType,
    CourseAssignment,
    Enrollment,
    MentorAssignment,
)

# Operations
from app.models.attendance import Attendance, AttendanceStatus, LeaveRequest, LeaveStatus, LeaveType
from app.models.grade import Grade, GradeType
from app.models.lms import LMSResource, ResourceType, Announcement, TimetableSlot, DayOfWeek


# Export all models for convenient imports
__all__ = [
    "User", "UserRole",
    "Department",
    "Faculty",
    "Student",
    "Authority",
    "Section",
    "Course", "CourseType",
    "CourseAssignment",
    "Enrollment",
    "MentorAssignment",
    "Attendance", "AttendanceStatus",
    "LeaveRequest", "LeaveStatus", "LeaveType",
    "Grade", "GradeType",
    "LMSResource", "ResourceType",
    "Announcement",
    "TimetableSlot", "DayOfWeek",
]
