from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatAttachmentResponse(BaseModel):
    id: str
    name: str
    kind: Literal["image", "video", "text", "file"]
    media_type: str
    size_bytes: int
    url: str | None = None
    text_excerpt: str | None = None


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=4000)
    conversation_id: str | None = None
    history: list[ChatHistoryMessage] = Field(default_factory=list)


class ExplainSignRequest(BaseModel):
    sign: str = Field(min_length=1, max_length=200)


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    content: str
    sender: Literal["ai"] = "ai"
    timestamp: datetime
    attachments: list[ChatAttachmentResponse] = Field(default_factory=list)


class ChatConversationMessageResponse(BaseModel):
    id: str
    content: str
    sender: Literal["user", "ai"]
    timestamp: datetime
    attachments: list[ChatAttachmentResponse] = Field(default_factory=list)


class ChatConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_preview: str | None = None


class ChatConversationDetail(ChatConversationSummary):
    messages: list[ChatConversationMessageResponse] = Field(default_factory=list)