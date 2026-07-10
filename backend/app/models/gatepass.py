"""
Campus Connect ERP — Gate Pass Models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class GatePassStatus(str, enum.Enum):
    PENDING_MENTOR = "pending_mentor"
    PENDING_HOD = "pending_hod"
    PENDING_OM = "pending_om"
    APPROVED = "approved"
    REJECTED = "rejected"

class GatePass(Base):
    __tablename__ = "gate_passes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    
    reason = Column(Text, nullable=False)
    out_time = Column(DateTime(timezone=True), nullable=False)
    expected_in_time = Column(DateTime(timezone=True), nullable=True)
    actual_in_time = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(SQLEnum(GatePassStatus), default=GatePassStatus.PENDING_MENTOR, nullable=False)
    
    viewed_by_mentor = Column(Boolean, default=False, nullable=False)
    viewed_by_hod = Column(Boolean, default=False, nullable=False)
    viewed_by_om = Column(Boolean, default=False, nullable=False)
    
    # Audit trail
    mentor_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    mentor_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    hod_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    hod_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    om_id = Column(Integer, ForeignKey("authorities.id"), nullable=True)
    om_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    rejection_reason = Column(Text, nullable=True)
    is_deleted_by_student = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Forward relationships only to avoid modifying existing models (except Student which was updated for cascade delete)
    student = relationship("Student", back_populates="gate_passes", foreign_keys=[student_id])
    mentor = relationship("Faculty", foreign_keys=[mentor_id])
    hod = relationship("Faculty", foreign_keys=[hod_id])
    om = relationship("Authority", foreign_keys=[om_id])


class FacultyGatePassStatus(str, enum.Enum):
    PENDING_HOD = "pending_hod"
    PENDING_DEAN = "pending_dean"
    PENDING_OM = "pending_om"
    APPROVED = "approved"
    REJECTED = "rejected"


class FacultyGatePass(Base):
    __tablename__ = "faculty_gate_passes"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    
    reason = Column(Text, nullable=False)
    out_time = Column(DateTime(timezone=True), nullable=False)
    expected_in_time = Column(DateTime(timezone=True), nullable=True)
    actual_in_time = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(SQLEnum(FacultyGatePassStatus), default=FacultyGatePassStatus.PENDING_HOD, nullable=False)
    
    viewed_by_hod = Column(Boolean, default=False, nullable=False)
    viewed_by_dean = Column(Boolean, default=False, nullable=False)
    viewed_by_om = Column(Boolean, default=False, nullable=False)
    
    # Audit trail
    hod_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    hod_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    dean_id = Column(Integer, ForeignKey("authorities.id"), nullable=True)
    dean_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    om_id = Column(Integer, ForeignKey("authorities.id"), nullable=True)
    om_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    rejection_reason = Column(Text, nullable=True)
    is_deleted_by_faculty = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Forward relationships
    faculty = relationship("Faculty", foreign_keys=[faculty_id])
    hod_approver = relationship("Faculty", foreign_keys=[hod_id])
    dean = relationship("Authority", foreign_keys=[dean_id])
    om = relationship("Authority", foreign_keys=[om_id])
