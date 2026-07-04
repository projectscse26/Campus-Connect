"""
Campus Connect ERP — Faculty Model

Complete faculty profile with all personal, academic, and contact details.
"""

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    # --- Personal Details ---
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=True)            # Male / Female / Other
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(5), nullable=True)
    nationality = Column(String(50), default="Indian")
    community = Column(String(50), nullable=True)         # OBC, MBC, SC, ST, etc.
    religion = Column(String(100), nullable=True)
    photo_url = Column(String(500), nullable=True)

    # --- Contact Details ---
    college_email = Column(String(255), unique=True, nullable=False)
    personal_email = Column(String(255), nullable=True)
    phone = Column(String(15), nullable=False)
    alternate_phone = Column(String(15), nullable=True)

    # --- Address ---
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)

    # --- Professional Details ---
    employee_id = Column(String(50), unique=True, nullable=False)
    designation = Column(String(100), nullable=True)      # Asst. Prof / Assoc. Prof / Prof
    qualification = Column(String(200), nullable=True)    # M.Tech, Ph.D, etc.
    specialization = Column(String(200), nullable=True)
    experience_years = Column(Integer, nullable=True)
    date_of_joining = Column(Date, nullable=True)
    employment_type = Column(String(50), nullable=True)   # Permanent / Contract / Visiting

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", foreign_keys=[department_id], back_populates="faculty_members")
    headed_department = relationship("Department", foreign_keys="Department.hod_id", back_populates="hod", uselist=False)
    course_assignments = relationship("CourseAssignment", back_populates="faculty")
    mentored_students = relationship("MentorAssignment", back_populates="mentor")
    class_advisor_sections = relationship("Section", back_populates="class_advisor")
