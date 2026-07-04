"""
Campus Connect ERP — Attendance Model

Tracks per-class attendance for students.
"""

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, ForeignKey, Boolean,
    Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


# ──────────────────────────────────────────────────
# ATTENDANCE (Per student, per course, per date)
# ──────────────────────────────────────────────────
class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    ON_DUTY = "on_duty"
    LATE = "late"
    HOLIDAY = "holiday"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    date = Column(Date, nullable=False)
    hour = Column(Integer, nullable=True)                     # 1-7 period number
    status = Column(SQLEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    marked_by_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    course = relationship("Course", back_populates="attendance_records")
    marked_by = relationship("Faculty")
