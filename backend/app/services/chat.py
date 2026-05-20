import json
import logging
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from chat_ai import OpenRouterChatClient
from repositories import ChatRepository
from schemas.chat import (
    ChatAttachmentResponse,
    ChatConversationDetail,
    ChatConversationMessageResponse,
    ChatConversationSummary,
    ChatMessageResponse,
    ChatRequest,
)
from services.chat_attachments import (
    build_message_preview,
    build_user_message_content,
    deserialize_attachments,
    serialize_attachments,
)

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = (
    "You are an AI chatbot for a sign language learning platform. "
    "Reply in Vietnamese by default, keep answers clear and practical, and explain sign-language concepts in simple terms when relevant. "
    "Prefer short answers under 180 Vietnamese words unless the user explicitly asks for detail. "
    "When users attach images, analyze them directly. When users attach videos or generic files, use only the provided metadata or extracted text and briefly state any limitation."
)

SIGN_EXPLANATION_PROMPT = (
    "You are a Vietnamese sign language tutor. "
    "Explain the meaning of the sign, when it is used, and give one short practice tip."
)

MAX_HISTORY_MESSAGES = 12
MAX_PREVIEW_LENGTH = 96


class ChatService:
    def __init__(
        self,
        db: Session,
        user_id: UUID,
        client: OpenRouterChatClient | None = None,
        repository: ChatRepository | None = None,
    ):
        self.db = db
        self.user_id = user_id
        self.client = client or OpenRouterChatClient()
        self.repository = repository or ChatRepository(db)

    def list_conversations(self) -> list[ChatConversationSummary]:
        conversations = self.repository.list_conversations(self.user_id)
        return [self._serialize_conversation_summary(item) for item in conversations]

    def get_conversation(self, conversation_id: str) -> ChatConversationDetail:
        conversation = self._require_conversation(conversation_id, include_messages=True)
        return self._serialize_conversation_detail(conversation)

    def delete_conversation(self, conversation_id: str) -> None:
        conversation = self._require_conversation(conversation_id)
        self.repository.delete_conversation(conversation)

    def send_message(
        self,
        request_data: ChatRequest,
        attachments: list[dict[str, Any]] | None = None,
    ) -> ChatMessageResponse:
        conversation = self._prepare_conversation(request_data, attachments or [])
        messages = self._build_model_messages(conversation.id)

        result = self.client.create_chat_completion(messages)
        content = self._normalize_ai_content(result.get("content"))
        assistant_message = self.repository.add_message(conversation, "assistant", content)
        return self._serialize_chat_response(assistant_message, conversation.id)

    def stream_message(
        self,
        request_data: ChatRequest,
        attachments: list[dict[str, Any]] | None = None,
    ):
        conversation = self._prepare_conversation(request_data, attachments or [])
        yield self._format_sse(
            {
                "type": "conversation",
                "conversation": self._serialize_conversation_summary(
                    self._require_conversation(str(conversation.id), include_messages=True)
                ).model_dump(mode="json"),
            }
        )

        accumulated_chunks: list[str] = []

        try:
            for chunk in self.client.stream_chat_completion(self._build_model_messages(conversation.id)):
                delta = chunk.get("content") or ""
                if not delta:
                    continue

                accumulated_chunks.append(delta)
                yield self._format_sse({"type": "delta", "delta": delta})
        except RuntimeError as exc:
            logger.exception("Chat upstream streaming request failed")
            yield self._format_sse({"type": "error", "detail": str(exc)})
            return

        content = self._normalize_ai_content("".join(accumulated_chunks))
        if not accumulated_chunks and content:
            yield self._format_sse({"type": "delta", "delta": content})

        assistant_message = self.repository.add_message(conversation, "assistant", content)
        refreshed_conversation = self._require_conversation(str(conversation.id), include_messages=True)

        yield self._format_sse(
            {
                "type": "done",
                "message": self._serialize_chat_response(
                    assistant_message,
                    conversation.id,
                ).model_dump(mode="json"),
                "conversation": self._serialize_conversation_summary(refreshed_conversation).model_dump(mode="json"),
            }
        )

    def explain_sign(self, sign: str) -> ChatMessageResponse:
        result = self.client.create_chat_completion(
            [
                {"role": "system", "content": SIGN_EXPLANATION_PROMPT},
                {
                    "role": "user",
                    "content": f"Hãy giải thích ký hiệu '{sign.strip()}' bằng tiếng Việt.",
                },
            ]
        )

        content = (result.get("content") or "").strip()
        if not content:
            content = "Mình chưa giải thích được ký hiệu này. Bạn hãy thử lại với từ khác."

        return ChatMessageResponse(
            id=str(uuid4()),
            conversation_id="sign-explanation",
            content=content,
            timestamp=datetime.utcnow(),
        )

    def _prepare_conversation(
        self,
        request_data: ChatRequest,
        attachments: list[dict[str, Any]],
    ):
        trimmed_message = request_data.message.strip()
        if not trimmed_message and not attachments:
            raise ValueError("Message or attachment is required.")

        if request_data.conversation_id:
            conversation = self._require_conversation(request_data.conversation_id)
        else:
            conversation = self.repository.create_conversation(
                self.user_id,
                self._build_conversation_title(request_data, attachments),
            )

            for item in request_data.history[-MAX_HISTORY_MESSAGES:]:
                self.repository.add_message(
                    conversation,
                    item.role,
                    item.content.strip(),
                )

        self.repository.add_message(
            conversation,
            "user",
            trimmed_message,
            attachments_json=serialize_attachments(attachments),
        )
        return conversation

    def _build_model_messages(self, conversation_id: UUID) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
        conversation_messages = self.repository.get_recent_messages(conversation_id, MAX_HISTORY_MESSAGES)
        latest_user_message_id = next(
            (
                item.id
                for item in reversed(conversation_messages)
                if self._map_sender_to_model_role(item.sender) == "user"
            ),
            None,
        )

        for item in conversation_messages:
            attachments = deserialize_attachments(item.attachments_json)
            role = self._map_sender_to_model_role(item.sender)
            messages.append(
                {
                    "role": role,
                    "content": (
                        build_user_message_content(
                            item.content,
                            attachments,
                            include_inline_images=item.id == latest_user_message_id,
                        )
                        if role == "user"
                        else item.content.strip()
                    ),
                }
            )

        return messages

    def _serialize_chat_response(self, message, conversation_id: UUID) -> ChatMessageResponse:
        return ChatMessageResponse(
            id=str(message.id),
            conversation_id=str(conversation_id),
            content=message.content,
            timestamp=message.created_at,
            attachments=self._serialize_attachments(message.attachments_json),
        )

    def _serialize_conversation_message(self, message) -> ChatConversationMessageResponse:
        return ChatConversationMessageResponse(
            id=str(message.id),
            content=message.content,
            sender="ai" if message.sender == "assistant" else "user",
            timestamp=message.created_at,
            attachments=self._serialize_attachments(message.attachments_json),
        )

    def _serialize_conversation_summary(self, conversation) -> ChatConversationSummary:
        preview = None
        if conversation.messages:
            latest_message = conversation.messages[-1]
            preview = self._truncate_preview(
                build_message_preview(
                    latest_message.content,
                    deserialize_attachments(latest_message.attachments_json),
                )
            )

        return ChatConversationSummary(
            id=str(conversation.id),
            title=conversation.title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            last_message_preview=preview,
        )

    def _serialize_conversation_detail(self, conversation) -> ChatConversationDetail:
        summary = self._serialize_conversation_summary(conversation)
        return ChatConversationDetail(
            **summary.model_dump(),
            messages=[
                self._serialize_conversation_message(message)
                for message in conversation.messages
            ],
        )

    def _require_conversation(self, conversation_id: str, include_messages: bool = False):
        conversation = self.repository.get_conversation(
            UUID(conversation_id),
            self.user_id,
            include_messages=include_messages,
        )
        if not conversation:
            raise LookupError("Conversation not found.")
        return conversation

    def _build_conversation_title(
        self,
        request_data: ChatRequest,
        attachments: list[dict[str, Any]],
    ) -> str:
        for item in request_data.history:
            if item.role == "user" and item.content.strip():
                return self._truncate_preview(item.content.strip(), limit=60)

        preview_source = build_message_preview(request_data.message.strip(), attachments)
        if not preview_source:
            preview_source = "Cuoc chat co tep dinh kem"
        return self._truncate_preview(preview_source, limit=60)

    def _normalize_ai_content(self, content: str | None) -> str:
        normalized = (content or "").strip()
        if normalized:
            return normalized

        logger.warning("OpenRouter returned an empty chat response")
        return "Mình chưa có câu trả lời phù hợp. Bạn hãy thử hỏi lại ngắn gọn hơn."

    def _truncate_preview(self, content: str, limit: int = MAX_PREVIEW_LENGTH) -> str:
        compact = " ".join(content.split())
        if len(compact) <= limit:
            return compact
        return f"{compact[: limit - 1].rstrip()}..."

    def _map_sender_to_model_role(self, sender: str) -> str:
        return "assistant" if sender == "assistant" else "user"

    def _serialize_attachments(self, raw_value: str | None) -> list[ChatAttachmentResponse]:
        return [
            ChatAttachmentResponse.model_validate(item)
            for item in deserialize_attachments(raw_value)
        ]

    def _format_sse(self, payload: dict) -> str:
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"