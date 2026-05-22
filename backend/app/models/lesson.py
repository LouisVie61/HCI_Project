from sqlalchemy import (
    Column, String, Text, Integer, Float,
    ForeignKey, DateTime, Boolean, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from core.database import Base

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    difficulty = Column(String(50), default="beginner") # beginner/intermediate/advanced
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    progress = relationship("LessonProgress", back_populates="lesson")

    def __repr__(self):
        return f"<Lesson {self.title}>"

class LessonProgress(Base):
    __tablename__ = "lesson_progresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False)

    # progress can be "not_started", "in_progress", "completed"
    status = Column(
        Enum("not_started", "in_progress", "completed",name="progress_status"),
        default="not_started",
        nullable=False,
    )

    progress_percent = Column(Float, default=0.0)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_accessed_at = Column(DateTime, default=datetime.utcnow)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lesson = relationship("Lesson", back_populates="progress")

    def __repr__(self):
        return f"<LessonProgress user={self.user_id} {self.progress_percent}%>"



