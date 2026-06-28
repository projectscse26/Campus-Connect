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

    model_config = ConfigDict(from_attributes=True)

class LateAnalytics(BaseModel):
    total_lates: int
    recent_trend: List[dict]  # e.g., [{"date": "2026-06-21", "count": 5}]
    frequent_latecomers: List[dict]  # e.g., [{"student_id": 1, "name": "John", "count": 3}]
