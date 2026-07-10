from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime

class CoursePlanTopicBase(BaseModel):
    sequence_no: int
    proposed_date: Optional[date] = None
    hours: int
    unit: str
    topic: str
    cognitive_level: str
    mode_of_delivery: str
    actual_date: Optional[date] = None
    reason_for_deviation: Optional[str] = None
    is_signed: bool

class CoursePlanTopicCreate(CoursePlanTopicBase):
    pass

class CoursePlanTopicResponse(CoursePlanTopicBase):
    id: int
    course_plan_id: int
    signed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CoursePlanCreate(BaseModel):
    topics: List[CoursePlanTopicCreate]

class CoursePlanResponse(BaseModel):
    id: int
    course_assignment_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    topics: List[CoursePlanTopicResponse]

    model_config = ConfigDict(from_attributes=True)
