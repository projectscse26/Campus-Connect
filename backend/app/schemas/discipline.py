from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date, datetime
from app.models.discipline import IncidentCategory, ActionStatus

class DisciplineBase(BaseModel):
    student_id: int
    incident_type: IncidentCategory
    incident_date: Optional[date] = None
    remarks: Optional[str] = None
    action_status: Optional[ActionStatus] = ActionStatus.NOT_INFORMED
    action_taken: Optional[str] = None

class DisciplineCreate(DisciplineBase):
    pass

class DisciplineUpdate(BaseModel):
    incident_type: Optional[IncidentCategory] = None
    incident_date: Optional[date] = None
    remarks: Optional[str] = None
    action_status: Optional[ActionStatus] = None
    action_taken: Optional[str] = None
    is_locked: Optional[bool] = None

class DisciplineResponse(DisciplineBase):
    id: int
    reported_by_id: int
    is_locked: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # We can include simple nested dicts for student/reporter info if needed
    student_name: Optional[str] = None
    student_register_number: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None

    class Config:
        from_attributes = True

# Analytics Schemas
class CategoryCount(BaseModel):
    category: str
    count: int

class TrendPoint(BaseModel):
    period: str
    count: int

class DisciplineAnalytics(BaseModel):
    total_incidents: int
    category_distribution: List[CategoryCount]
    recent_trend: List[TrendPoint]
