"""
Campus Connect ERP — Grading & Assessment Models
"""

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Boolean,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class GradeType(str, enum.Enum):
    INTERNAL_1  = "internal_1"   # CIA 1  — max 50
    INTERNAL_2  = "internal_2"   # CIA 2  — max 50
    MODEL_EXAM  = "model_exam"   # Model Exam — max 60
    ASSIGNMENT  = "assignment"
    LAB         = "lab"
    EXTERNAL    = "external"


# Fixed max marks per assessment type
GRADE_MAX_MARKS = {
    GradeType.INTERNAL_1: 50,
    GradeType.INTERNAL_2: 50,
    GradeType.MODEL_EXAM: 60,
    GradeType.ASSIGNMENT: 100,
    GradeType.LAB:        100,
    GradeType.EXTERNAL:   100,
}

# Passing threshold per assessment type
GRADE_PASS_MARKS = {
    GradeType.INTERNAL_1: 25,
    GradeType.INTERNAL_2: 25,
    GradeType.MODEL_EXAM: 30,
}


class Grade(Base):
    __tablename__ = "grades"

    id             = Column(Integer, primary_key=True, index=True)
    student_id     = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id      = Column(Integer, ForeignKey("courses.id"), nullable=False)
    grade_type     = Column(SQLEnum(GradeType), nullable=False)
    marks_obtained = Column(Numeric(6, 2), nullable=True)   # nullable = absent
    max_marks      = Column(Numeric(6, 2), nullable=False, default=100)
    academic_year  = Column(String(20), nullable=False)
    semester       = Column(Integer, nullable=False)
    graded_by_id   = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    remarks        = Column(Text, nullable=True)
    is_published   = Column(Boolean, default=False, nullable=False)
    is_absent      = Column(Boolean, default=False, nullable=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student    = relationship("Student", back_populates="grades")
    course     = relationship("Course", back_populates="grades")
    graded_by  = relationship("Faculty")


class AssignmentGrade(Base):
    __tablename__ = "assignment_grades"

    id             = Column(Integer, primary_key=True, index=True)
    assignment_id  = Column(Integer, ForeignKey("lms_resources.id", ondelete="CASCADE"), nullable=False)
    student_id     = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    marks_obtained = Column(Numeric(6, 2), nullable=True)
    max_marks      = Column(Numeric(6, 2), nullable=False, default=100)
    is_absent      = Column(Boolean, default=False, nullable=False)
    is_published   = Column(Boolean, default=False, nullable=False)
    remarks        = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    assignment     = relationship("LMSResource")
    student        = relationship("Student")


class Seminar(Base):
    __tablename__ = "seminars"

    id                    = Column(Integer, primary_key=True, index=True)
    course_assignment_id  = Column(Integer, ForeignKey("course_assignments.id", ondelete="CASCADE"), nullable=False)
    student_id            = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    seminar_date          = Column(DateTime(timezone=True), nullable=True)
    seminar_topic         = Column(Text, nullable=True)
    marks_obtained        = Column(Numeric(6, 2), nullable=True)
    max_marks             = Column(Numeric(6, 2), nullable=False, default=100)
    is_topic_published    = Column(Boolean, default=False, nullable=False)
    is_marks_published    = Column(Boolean, default=False, nullable=False)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())
    updated_at            = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_assignment     = relationship("CourseAssignment")
    student               = relationship("Student")


