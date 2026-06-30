"""
Campus Connect ERP — Mentorship Models

Tracks:
  - MentoringMeeting: Sessions requested by students, approved/completed by faculty mentor
  - AdvisingLog: Faculty-registered notes per student (performance reviews, personal challenges, etc.)
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class MeetingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    REJECTED = "rejected"


class MentoringMeeting(Base):
    """
    A mentoring session — can be requested by a student or scheduled by the faculty mentor.
    """
    __tablename__ = "mentoring_meetings"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    topic = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(SQLEnum(MeetingStatus), default=MeetingStatus.PENDING, nullable=False)
    requested_by_student = Column(Boolean, default=False)   # True = student initiated

    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    mentor = relationship("Faculty", foreign_keys=[mentor_id])
    student = relationship("Student", foreign_keys=[student_id])


class AdvisingLog(Base):
    """
    Faculty-registered advising note for a specific mentee.
    """
    __tablename__ = "advising_logs"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    note = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    mentor = relationship("Faculty", foreign_keys=[mentor_id])
    student = relationship("Student", foreign_keys=[student_id])
