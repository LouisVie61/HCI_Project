from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

#Lesson Schemas

class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "beginner"
    order_index: int = 0

class LessonCreate(LessonBase):
    content: Optional[str] = None
    is_published: bool = False

class LessonResponse(LessonBase):
    id: UUID
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True # cho phép convert từ SQLAlchemy object

class LessonDetailResponse(LessonResponse):
    content: Optional[str] = None

# Progress Schemas

class ProgressUpdate(BaseModel):
    # Field(ge=0.0, le=100.0) = chỉ chấp nhận giá trị 0–100
    progress_percent: float = Field(ge=0.0, le=100.0)

class ProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    lesson_id: UUID
    status: str
    progress_percent: float
    started_at: Optional[datetime] = None
    complete_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
