"""
Campus Connect ERP — Faculty Leave Models

Defines the tables for Faculty Leave Requests, Balances, and Duty Arrangements.
"""

from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base

class LeaveStatus(str, enum.Enum):
    PENDING_SUBSTITUTE = "pending_substitute"
    PENDING_HOD = "pending_hod"
    PENDING_DEAN = "pending_dean"
    PENDING_OM = "pending_om"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class ArrangementStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class FacultyLeaveRequest(Base):
    __tablename__ = "faculty_leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    leave_type = Column(String(50), nullable=False) # Casual, Sick, Earned, Vacation, Medical, On-Duty, etc.
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    duration_days = Column(Integer, nullable=False)
    reason = Column(String(500), nullable=False)
    attachment_url = Column(String(500), nullable=True)
    
    status = Column(SQLEnum(LeaveStatus), default=LeaveStatus.PENDING_SUBSTITUTE)
    
    # Audit tracking
    hod_approved_by = Column(Integer, ForeignKey("faculty.id"), nullable=True) # HOD is a faculty
    dean_approved_by = Column(Integer, ForeignKey("authorities.id"), nullable=True)
    om_approved_by = Column(Integer, ForeignKey("authorities.id"), nullable=True)
    rejection_reason = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    faculty = relationship("Faculty", foreign_keys=[faculty_id])
    arrangements = relationship("FacultyDutyArrangement", back_populates="leave_request", cascade="all, delete-orphan")


class FacultyDutyArrangement(Base):
    __tablename__ = "faculty_duty_arrangements"

    id = Column(Integer, primary_key=True, index=True)
    leave_request_id = Column(Integer, ForeignKey("faculty_leave_requests.id"), nullable=False)
    substitute_faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    class_section = Column(String(50), nullable=False)
    period = Column(String(50), nullable=False)
    
    status = Column(SQLEnum(ArrangementStatus), default=ArrangementStatus.PENDING)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    leave_request = relationship("FacultyLeaveRequest", back_populates="arrangements")
    substitute_faculty = relationship("Faculty", foreign_keys=[substitute_faculty_id])


class FacultyLeaveBalance(Base):
    __tablename__ = "faculty_leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    academic_year = Column(String(20), nullable=False) # e.g., '2023-2024'
    
    casual_leaves_total = Column(Integer, default=15)
    casual_leaves_used = Column(Integer, default=0)
    
    sick_leaves_total = Column(Integer, default=10)
    sick_leaves_used = Column(Integer, default=0)
    
    earned_leaves_total = Column(Integer, default=30)
    earned_leaves_used = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    faculty = relationship("Faculty", foreign_keys=[faculty_id])
