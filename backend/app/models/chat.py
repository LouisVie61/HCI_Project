from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    attachments_json = Column(Text, nullable=True, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("ChatConversation", back_populates="messages")