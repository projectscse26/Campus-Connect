"""
Campus Connect ERP — Student Model

Complete student profile as per the user's ER diagram requirements:
Name, Register Number, Gender, DOB, Department, Batch, Year, Section,
Semester, College Mail, Personal Mail, Phone, Father/Mother details,
Annual Income, Address, Blood Group, Nationality, Community,
10th & 12th school details.
"""

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Numeric, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)

    # --- Personal Details ---
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    register_number = Column(String(50), unique=True, nullable=False, index=True)
    gender = Column(String(10), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(5), nullable=True)
    nationality = Column(String(50), default="Indian")
    community = Column(String(50), nullable=True)         # OBC, MBC, SC, ST, BC, etc.
    photo_url = Column(String(500), nullable=True)

    # --- Academic Details ---
    batch = Column(String(20), nullable=False)             # e.g., "2023-2027"
    current_year = Column(Integer, nullable=True)          # 1, 2, 3, 4
    current_semester = Column(Integer, nullable=True)      # 1-8
    admission_date = Column(Date, nullable=True)
    admission_type = Column(String(50), nullable=True)     # CENTAC / MANAGEMENT

    # --- Contact Details ---
    college_email = Column(String(255), unique=True, nullable=False)
    personal_email = Column(String(255), nullable=True)
    phone = Column(String(15), nullable=False)

    # --- Parent / Guardian Details ---
    father_name = Column(String(150), nullable=True)
    father_phone = Column(String(15), nullable=True)
    father_occupation = Column(String(100), nullable=True)
    mother_name = Column(String(150), nullable=True)
    mother_phone = Column(String(15), nullable=True)
    mother_occupation = Column(String(100), nullable=True)
    annual_income = Column(Numeric(12, 2), nullable=True)

    # --- Address ---
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)

    religion = Column(String(100), nullable=True)

    # --- 10th Standard Details ---
    tenth_school = Column(String(255), nullable=True)
    tenth_board = Column(String(100), nullable=True)       # State Board / CBSE / ICSE
    tenth_marks = Column(Numeric(6, 2), nullable=True)
    tenth_percentage = Column(Numeric(5, 2), nullable=True)

    # --- 12th Standard Details ---
    twelfth_school = Column(String(255), nullable=True)
    twelfth_board = Column(String(100), nullable=True)
    twelfth_marks = Column(Numeric(6, 2), nullable=True)
    twelfth_percentage = Column(Numeric(5, 2), nullable=True)

    # --- Admission Details ---
    admission_date = Column(Date, nullable=True)
    admission_type = Column(String(50), nullable=True)     # Counselling / Management / Lateral Entry

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    section = relationship("Section", back_populates="students")
    mentor_assignment = relationship("MentorAssignment", back_populates="student", uselist=False, cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    leave_requests = relationship("StudentLeaveRequest", back_populates="student", cascade="all, delete-orphan")
    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
