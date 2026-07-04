from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum

from app.core.database import Base

class IncidentCategory(str, enum.Enum):
    NO_SHOE = "No Shoe"
    NO_ID_CARD = "No ID Card"
    IMPROPER_HAIRCUT = "Improper Haircut / Beard"
    IMPROPER_DRESS_CODE = "Improper Dress Code"
    OTHER = "Other Disruptive Behavior"

class ActionStatus(str, enum.Enum):
    INFORMED = "Informed"
    NOT_INFORMED = "Not Informed"
    LETTER_GIVEN = "Letter Given"

class DisciplineRecord(Base):
    __tablename__ = "discipline_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    incident_type = Column(SQLEnum(IncidentCategory), nullable=False)
    incident_date = Column(Date, nullable=False, default=func.current_date())
    remarks = Column(Text, nullable=True)
    action_status = Column(SQLEnum(ActionStatus), default=ActionStatus.NOT_INFORMED)
    action_taken = Column(Text, nullable=True) # Kept for manual text details if needed
    
    is_locked = Column(Boolean, default=True)  # Admin can unlock/edit if necessary
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student", backref=backref("discipline_records", cascade="all, delete-orphan"))
    reported_by = relationship("User", backref="reported_incidents")
