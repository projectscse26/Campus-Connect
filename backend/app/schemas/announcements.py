from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    category: str = "General"
    target_audience: str = "Everyone"
    is_global: bool = False

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    target_audience: Optional[str] = None
    is_global: Optional[bool] = None

class AuthorResponse(BaseModel):
    name: str
    role: str
    designation: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: int
    course_id: Optional[int]
    department_id: Optional[int]
    posted_by_id: int
    title: str
    content: str
    category: str
    target_audience: str
    is_global: bool
    created_at: datetime
    author: Optional[AuthorResponse] = None

    model_config = ConfigDict(from_attributes=True)
