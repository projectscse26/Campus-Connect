from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class CoursePlan(Base):
    __tablename__ = "course_plans"

    id = Column(Integer, primary_key=True, index=True)
    course_assignment_id = Column(Integer, ForeignKey("course_assignments.id"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_assignment = relationship("CourseAssignment")
    topics = relationship("CoursePlanTopic", back_populates="course_plan", cascade="all, delete-orphan")

class CoursePlanTopic(Base):
    __tablename__ = "course_plan_topics"

    id = Column(Integer, primary_key=True, index=True)
    course_plan_id = Column(Integer, ForeignKey("course_plans.id"), nullable=False)
    sequence_no = Column(Integer, nullable=False)        # S.No.
    proposed_date = Column(Date, nullable=True)           # Proposed Date (editable)
    hours = Column(Integer, nullable=False, default=1)   # Hours
    unit = Column(String(50), nullable=False)             # Unit / Module (e.g. "1", "TUTORIAL-I")
    topic = Column(String(500), nullable=False)           # Topic(s)
    cognitive_level = Column(String(20), nullable=False, default="K1") # K1, K2, K3, K4, K5, K6
    mode_of_delivery = Column(String(50), nullable=False, default="BB") # BB, PPT, or custom manually entered mode
    
    # Progress & Verification Columns (Work Done Note)
    actual_date = Column(Date, nullable=True)             # Actual Date of Topic Covered
    reason_for_deviation = Column(Text, nullable=True)     # Reason for Deviation (required if actual_date != proposed_date)
    is_signed = Column(Boolean, default=False)            # Staff sign-off checkbox
    signed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    course_plan = relationship("CoursePlan", back_populates="topics")
