"""
Campus Connect ERP — Academic Structure Models

Section, Course, CourseAssignment, Enrollment, and MentorAssignment.
These tables define the academic backbone of the system.
"""

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


# ──────────────────────────────────────────────────
# SECTION (e.g., CSE-A Year 2, CSE-B Year 3)
# ──────────────────────────────────────────────────
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String(10), nullable=False)              # A, B, C
    year = Column(Integer, nullable=False)                 # 1, 2, 3, 4
    batch = Column(String(20), nullable=False)             # "2023-2027"
    class_advisor_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    department = relationship("Department", back_populates="sections")
    class_advisor = relationship("Faculty", back_populates="class_advisor_sections")
    students = relationship("Student", back_populates="section")


# ──────────────────────────────────────────────────
# COURSE (e.g., CS601 - Data Structures)
# ──────────────────────────────────────────────────
class CourseType(str, enum.Enum):
    THEORY = "theory"
    LAB = "lab"
    ELECTIVE = "elective"
    PROJECT = "project"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # CS601
    name = Column(String(200), nullable=False)               # Data Structures & Algorithms
    short_name = Column(String(20), nullable=True)           # CN, DS, OS etc.
    credits = Column(Integer, nullable=False, default=3)
    course_type = Column(SQLEnum(CourseType), default=CourseType.THEORY)
    semester = Column(Integer, nullable=True)                 # Which semester this course belongs to
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    department = relationship("Department", back_populates="courses")
    assignments = relationship("CourseAssignment", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
    attendance_records = relationship("Attendance", back_populates="course")
    grades = relationship("Grade", back_populates="course")
    lms_resources = relationship("LMSResource", back_populates="course")
    announcements = relationship("Announcement", back_populates="course")


# ──────────────────────────────────────────────────
# COURSE ASSIGNMENT (Faculty → Course → Section mapping)
# ──────────────────────────────────────────────────
class CourseAssignment(Base):
    __tablename__ = "course_assignments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    academic_year = Column(String(20), nullable=False)       # "2024-2025"
    semester = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    faculty = relationship("Faculty", back_populates="course_assignments")
    course = relationship("Course", back_populates="assignments")
    section = relationship("Section")


# ──────────────────────────────────────────────────
# ENROLLMENT (Student → Course registration)
# ──────────────────────────────────────────────────
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    semester = Column(Integer, nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


# ──────────────────────────────────────────────────
# MENTOR ASSIGNMENT (Faculty mentor → Student)
# ──────────────────────────────────────────────────
class MentorAssignment(Base):
    __tablename__ = "mentor_assignments"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    academic_year = Column(String(20), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    mentor = relationship("Faculty", back_populates="mentored_students")
    student = relationship("Student", back_populates="mentor_assignment")
