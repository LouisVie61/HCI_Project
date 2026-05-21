import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from api.v1.dependencies import get_current_user
from core.database import get_db
from schemas import (
    ChatConversationDetail,
    ChatConversationSummary,
    ChatMessageResponse,
    ChatRequest,
    ExplainSignRequest,
)
from services import ChatService
from services.chat_attachments import prepare_attachments

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def _map_value_error(exc: ValueError) -> HTTPException:
    status_code = (
        status.HTTP_503_SERVICE_UNAVAILABLE
        if "OPENROUTER_API_KEY" in str(exc)
        else status.HTTP_400_BAD_REQUEST
    )
    return HTTPException(status_code=status_code, detail=str(exc))


async def _parse_chat_request(request: Request) -> tuple[ChatRequest, list[UploadFile]]:
    content_type = request.headers.get("content-type", "")
    payload: dict | list | None = None
    uploaded_files: list[UploadFile] = []

    if "multipart/form-data" in content_type:
        form = await request.form()
        history_raw = str(form.get("history") or "[]")
        try:
            history_payload = json.loads(history_raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid history payload.",
            ) from exc

        payload = {
            "message": str(form.get("message") or ""),
            "conversation_id": form.get("conversation_id") or None,
            "history": history_payload,
        }
        uploaded_files = [
            value
            for value in form.getlist("files")
            if getattr(value, "filename", None)
        ]
    else:
        try:
            payload = await request.json()
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload.",
            ) from exc

    try:
        request_data = ChatRequest.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        ) from exc

    return request_data, uploaded_files


@router.post("", response_model=ChatMessageResponse)
async def send_message(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        request_data, uploaded_files = await _parse_chat_request(request)
        attachments = await prepare_attachments(uploaded_files)
        chat_service = ChatService(db=db, user_id=current_user.id)
        return chat_service.send_message(request_data, attachments)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise _map_value_error(exc) from exc
    except RuntimeError as exc:
        logger.exception("Chat upstream request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.post("/stream")
async def stream_message(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        request_data, uploaded_files = await _parse_chat_request(request)
        attachments = await prepare_attachments(uploaded_files)
        chat_service = ChatService(db=db, user_id=current_user.id)
        return StreamingResponse(
            chat_service.stream_message(request_data, attachments),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise _map_value_error(exc) from exc


@router.get("/conversations", response_model=list[ChatConversationSummary])
def list_conversations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat_service = ChatService(db=db, user_id=current_user.id)
    return chat_service.list_conversations()


@router.get("/conversations/{conversation_id}", response_model=ChatConversationDetail)
def get_conversation(
    conversation_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        chat_service = ChatService(db=db, user_id=current_user.id)
        return chat_service.get_conversation(conversation_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        chat_service = ChatService(db=db, user_id=current_user.id)
        chat_service.delete_conversation(conversation_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post("/explain-sign", response_model=ChatMessageResponse)
def explain_sign(
    request_data: ExplainSignRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        chat_service = ChatService(db=db, user_id=current_user.id)
        return chat_service.explain_sign(request_data.sign)
    except ValueError as exc:
        raise _map_value_error(exc) from exc
    except RuntimeError as exc:
        logger.exception("Sign explanation upstream request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc