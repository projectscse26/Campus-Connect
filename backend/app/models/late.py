from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.discipline import ActionStatus

class LateRecord(Base):
    __tablename__ = "late_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    date = Column(Date, nullable=False, default=func.current_date())
    time = Column(Time, nullable=False, default=func.current_time())
    reason = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    action_status = Column(SQLEnum(ActionStatus), nullable=True, default=ActionStatus.NOT_INFORMED)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("Student", backref="late_records")
    recorded_by = relationship("User", backref="recorded_lates")
