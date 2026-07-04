from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from app.models.discipline import ActionStatus
import datetime as dt

class LateRecordBase(BaseModel):
    student_id: int
    date: Optional[dt.date] = None
    time: Optional[dt.time] = None
    reason: Optional[str] = None
    remarks: Optional[str] = None
    action_status: Optional[ActionStatus] = ActionStatus.NOT_INFORMED

class LateRecordCreate(LateRecordBase):
    pass

class LateRecordResponse(LateRecordBase):
    id: int
    recorded_by_id: int
    created_at: dt.datetime
    
    student_name: Optional[str] = None
    student_register_number: Optional[str] = None
    reporter_name: Optional[str] = None
    has_prior_notification: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class LateAnalytics(BaseModel):
    total_lates: int
    recent_trend: List[dict]  # e.g., [{"date": "2026-06-21", "count": 5}]
    frequent_latecomers: List[dict]  # e.g., [{"student_id": 1, "name": "John", "count": 3}]


# Late Entry Notification Schemas
class LateEntryNotificationCreate(BaseModel):
    date: dt.date
    expected_arrival_time: dt.time
    reason: str

class LateEntryNotificationResponse(BaseModel):
    id: int
    student_id: int
    mentor_id: Optional[int] = None
    date: dt.date
    expected_arrival_time: dt.time
    reason: str
    acknowledged_by_security: bool
    acknowledged_at: Optional[dt.datetime] = None
    viewed_by_mentor: bool
    viewed_at: Optional[dt.datetime] = None
    mentor_comment: Optional[str] = None
    mentor_comment_at: Optional[dt.datetime] = None
    created_at: dt.datetime
    
    # Additional fields for frontend
    student_name: Optional[str] = None
    student_register_number: Optional[str] = None
    department_name: Optional[str] = None
    section_name: Optional[str] = None
    mentor_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class LateEntryUsageSummary(BaseModel):
    used: int
    remaining: int
    monthly_limit: int
    can_submit: bool
