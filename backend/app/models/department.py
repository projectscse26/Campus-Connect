"""
Campus Connect ERP — Department Model

Represents an academic department (e.g., Computer Science, Mechanical).
All faculty and students belong to exactly one department.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)         # e.g., "Computer Science & Engineering"
    code = Column(String(20), unique=True, nullable=False)          # e.g., "CSE"
    hod_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)  # Nullable until HOD is assigned
    vision = Column(String(500), nullable=True)
    mission = Column(String(500), nullable=True)
    current_sem_start_date = Column(DateTime(timezone=True), nullable=True)
    attendance_closed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    hod = relationship("Faculty", foreign_keys=[hod_id], back_populates="headed_department")
    faculty_members = relationship("Faculty", foreign_keys="Faculty.department_id", back_populates="department")
    students = relationship("Student", back_populates="department")
    courses = relationship("Course", back_populates="department")
    sections = relationship("Section", back_populates="department")
