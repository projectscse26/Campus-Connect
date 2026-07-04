from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.discipline import ActionStatus

class LateRecord(Base):
    __tablename__ = "late_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    date = Column(Date, nullable=False, default=func.current_date())
    time = Column(Time, nullable=False, default=func.current_time())
    reason = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    action_status = Column(SQLEnum(ActionStatus), nullable=True, default=ActionStatus.NOT_INFORMED)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("Student", backref=backref("late_records", cascade="all, delete-orphan"))
    recorded_by = relationship("User", backref="recorded_lates")


class LateEntryNotification(Base):
    """
    Student-submitted late entry notifications (Phase 1: information only, no approval workflow)
    """
    __tablename__ = "late_entry_notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)  # Class Advisor/Mentor
    
    date = Column(Date, nullable=False)  # Date of expected late arrival
    expected_arrival_time = Column(Time, nullable=False)
    reason = Column(Text, nullable=False)
    
    # Track if watchman has seen this notification
    acknowledged_by_security = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Track if mentor has viewed this notification
    viewed_by_mentor = Column(Boolean, default=False)
    viewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Mentor acknowledgment comment
    mentor_comment = Column(Text, nullable=True)
    mentor_comment_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("Student", backref=backref("late_entry_notifications", cascade="all, delete-orphan"))
    mentor = relationship("Faculty", backref="late_entry_notifications")
