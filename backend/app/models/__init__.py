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
from app.models.gatepass import GatePass, GatePassStatus

# Academic
from app.models.academic import (
    Section,
    Course, CourseType,
    CourseAssignment,
    Enrollment,
    MentorAssignment,
)

# Mentorship
from app.models.mentorship import MentoringMeeting, MeetingStatus, AdvisingLog

# Operations
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import (
    FacultyLeaveRequest, FacultyDutyArrangement, FacultyLeaveBalance,
    StudentLeaveRequest, StudentLeaveStatus,
    LeaveStatus, ArrangementStatus,
)
from app.models.grade import Grade, GradeType
from app.models.lms import LMSResource, ResourceType, Announcement, TimetableSlot, DayOfWeek

__all__ = [
    "User", "UserRole",
    "Department",
    "Faculty",
    "Student",
    "Authority",
    "Alumni",
    "DisciplineRecord",
    "LateRecord",
    "GatePass", "GatePassStatus",
    "Section",
    "Course", "CourseType",
    "CourseAssignment",
    "Enrollment",
    "MentorAssignment",
    "MentoringMeeting", "MeetingStatus", "AdvisingLog",
    "Attendance", "AttendanceStatus",
    "FacultyLeaveRequest", "FacultyDutyArrangement", "FacultyLeaveBalance",
    "StudentLeaveRequest", "StudentLeaveStatus",
    "LeaveStatus", "ArrangementStatus",
    "Grade", "GradeType",
    "LMSResource", "ResourceType",
    "Announcement",
    "TimetableSlot", "DayOfWeek",
]
