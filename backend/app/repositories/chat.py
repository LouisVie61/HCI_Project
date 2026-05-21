from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from models import ChatConversation, ChatMessage


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_conversations(self, user_id: UUID) -> list[ChatConversation]:
        return (
            self.db.query(ChatConversation)
            .options(selectinload(ChatConversation.messages))
            .filter(ChatConversation.user_id == user_id)
            .order_by(ChatConversation.updated_at.desc())
            .all()
        )

    def get_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
        include_messages: bool = False,
    ) -> ChatConversation | None:
        query = self.db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id,
        )

        if include_messages:
            query = query.options(selectinload(ChatConversation.messages))

        return query.first()

    def create_conversation(self, user_id: UUID, title: str) -> ChatConversation:
        conversation = ChatConversation(user_id=user_id, title=title)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def add_message(
        self,
        conversation: ChatConversation,
        sender: str,
        content: str,
        attachments_json: str | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            conversation_id=conversation.id,
            sender=sender,
            content=content,
            attachments_json=attachments_json or "[]",
        )
        conversation.updated_at = datetime.utcnow()
        self.db.add(message)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(message)
        self.db.refresh(conversation)
        return message

    def get_recent_messages(self, conversation_id: UUID, limit: int) -> list[ChatMessage]:
        messages = (
            self.db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        messages.reverse()
        return messages

    def delete_conversation(self, conversation: ChatConversation) -> None:
        self.db.delete(conversation)
        self.db.commit()