"""
Campus Connect ERP — LMS & Communication Models

LMS Resources, Announcements, and Timetable.
"""

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text, Time,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


# ──────────────────────────────────────────────────
# LMS RESOURCE (Files, links, syllabus per course)
# ──────────────────────────────────────────────────
class ResourceType(str, enum.Enum):
    NOTES = "notes"
    SYLLABUS = "syllabus"
    ASSIGNMENT = "assignment"
    REFERENCE = "reference"
    VIDEO = "video"


class LMSResource(Base):
    __tablename__ = "lms_resources"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(SQLEnum(ResourceType), nullable=False)
    file_url = Column(String(500), nullable=True)
    external_link = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="lms_resources")
    uploaded_by = relationship("Faculty")


# ──────────────────────────────────────────────────
# ANNOUNCEMENT (Course-level or department-level)
# ──────────────────────────────────────────────────
class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, server_default="General")
    target_audience = Column(String(50), nullable=False, server_default="Everyone")
    is_global = Column(Boolean, default=False)  # True = visible to entire college
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="announcements")
    posted_by = relationship("User")


# ──────────────────────────────────────────────────
# TIMETABLE SLOT
# ──────────────────────────────────────────────────
class DayOfWeek(str, enum.Enum):
    MON = "mon"
    TUE = "tue"
    WED = "wed"
    THU = "thu"
    FRI = "fri"
    SAT = "sat"


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    course_assignment_id = Column(Integer, ForeignKey("course_assignments.id"), nullable=False)
    day = Column(SQLEnum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course_assignment = relationship("CourseAssignment")
