"""
Campus Connect ERP — Retest Mark Model

Stores retest marks for students who failed or were absent
in an internal assessment (internal_1, internal_2, model_exam).

Rules:
- A retest entry can only be created when the original Grade
  is published AND (is_absent=True OR marks_obtained < pass_mark).
- Only the faculty who teaches that course assignment can manage retest marks.
- Students can only see their own retest marks once is_published=True.
"""

from sqlalchemy import (
    Column, Integer, Numeric, Boolean, Text, DateTime,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RetestMark(Base):
    __tablename__ = "retest_marks"

    id                  = Column(Integer, primary_key=True, index=True)

    # Link to the original Grade row that was failed / absent
    grade_id            = Column(Integer, ForeignKey("grades.id"), nullable=False)

    # Denormalised for easy querying (avoids joins for every read)
    student_id          = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id           = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # The retest mark (nullable = absent in retest too)
    marks_obtained      = Column(Numeric(6, 2), nullable=True)
    max_marks           = Column(Numeric(6, 2), nullable=False)

    # Faculty who entered / last updated this mark
    entered_by_id       = Column(Integer, ForeignKey("faculty.id"), nullable=True)

    remarks             = Column(Text, nullable=True)

    # Only visible to the student once True
    is_published        = Column(Boolean, default=False, nullable=False)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    # One retest per student per original grade entry
    __table_args__ = (
        UniqueConstraint("grade_id", "student_id", name="uq_retest_grade_student"),
    )

    # Relationships
    grade       = relationship("Grade")
    student     = relationship("Student")
    course      = relationship("Course")
    entered_by  = relationship("Faculty")
