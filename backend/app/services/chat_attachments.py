from __future__ import annotations

import base64
import json
import mimetypes
import re
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import UploadFile

from core.config import settings

TEXT_MEDIA_PREFIXES = ("text/",)
TEXT_MEDIA_TYPES = {
    "application/json",
    "application/javascript",
    "application/xml",
    "application/x-yaml",
}
TEXT_SUFFIXES = {
    ".csv",
    ".html",
    ".json",
    ".js",
    ".jsx",
    ".md",
    ".py",
    ".txt",
    ".ts",
    ".tsx",
    ".xml",
    ".yaml",
    ".yml",
}


def ensure_attachment_dirs() -> None:
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    settings.CHAT_ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)


def serialize_attachments(attachments: list[dict[str, Any]]) -> str:
    return json.dumps(attachments, ensure_ascii=False)


def deserialize_attachments(raw_value: str | None) -> list[dict[str, Any]]:
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError:
        return []

    return parsed if isinstance(parsed, list) else []


async def prepare_attachments(files: list[UploadFile]) -> list[dict[str, Any]]:
    files = [file for file in files if file.filename]
    if not files:
        return []

    if len(files) > settings.CHAT_ATTACHMENT_MAX_FILES:
        raise ValueError(
            f"You can attach up to {settings.CHAT_ATTACHMENT_MAX_FILES} files at a time."
        )

    ensure_attachment_dirs()
    stored_attachments: list[dict[str, Any]] = []
    saved_paths: list[Path] = []

    try:
        for upload in files:
            file_bytes = await upload.read()
            size_bytes = len(file_bytes)
            if not size_bytes:
                raise ValueError(f"The file '{upload.filename}' is empty.")

            if size_bytes > settings.CHAT_ATTACHMENT_MAX_FILE_BYTES:
                raise ValueError(
                    f"'{upload.filename}' exceeds the {settings.CHAT_ATTACHMENT_MAX_FILE_BYTES // (1024 * 1024)} MB limit."
                )

            media_type = _detect_media_type(upload.filename or "", upload.content_type)
            file_suffix = Path(upload.filename or "attachment").suffix.lower()
            storage_name = f"{uuid4()}{file_suffix[:16]}"
            storage_path = settings.CHAT_ATTACHMENT_DIR / storage_name
            storage_path.write_bytes(file_bytes)
            saved_paths.append(storage_path)

            attachment = {
                "id": str(uuid4()),
                "name": upload.filename or storage_name,
                "kind": _detect_attachment_kind(media_type, upload.filename or ""),
                "media_type": media_type,
                "size_bytes": size_bytes,
                "storage_name": storage_name,
                "url": f"/uploads/chat/{storage_name}",
                "text_excerpt": _build_text_excerpt(file_bytes, media_type, upload.filename or ""),
            }
            stored_attachments.append(attachment)
    except Exception:
        for path in saved_paths:
            path.unlink(missing_ok=True)
        raise
    finally:
        for upload in files:
            await upload.close()

    return stored_attachments


def build_message_preview(content: str, attachments: list[dict[str, Any]]) -> str:
    compact = " ".join(content.split())
    if compact:
        return compact

    if not attachments:
        return ""

    if len(attachments) == 1:
        return f"Attachment: {attachments[0]['name']}"

    return f"{len(attachments)} attachments"


def build_user_message_content(
    message_text: str,
    attachments: list[dict[str, Any]],
    include_inline_images: bool = True,
) -> str | list[dict[str, Any]]:
    normalized_text = message_text.strip()
    if not attachments:
        return normalized_text

    text_sections: list[str] = []
    if normalized_text:
        text_sections.append(normalized_text)
    else:
        text_sections.append("The user sent attachments without additional text.")

    text_sections.append("Attached files:")
    multimodal_blocks: list[dict[str, Any]] = []

    for attachment in attachments:
        descriptor = _describe_attachment(attachment)
        text_sections.append(descriptor)

        if attachment["kind"] == "text" and attachment.get("text_excerpt"):
            text_sections.append(f"Excerpt from {attachment['name']}:\n{attachment['text_excerpt']}")

        if attachment["kind"] == "image" and include_inline_images:
            data_url = build_image_data_url(attachment)
            if data_url:
                multimodal_blocks.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    }
                )
            else:
                text_sections.append(
                    f"Image {attachment['name']} is attached but too large for inline vision processing in this request."
                )

        if attachment["kind"] == "video":
            text_sections.append(
                f"Raw video frames from {attachment['name']} are not parsed in this build. Use the metadata and ask the user for screenshots if visual details matter."
            )

        if attachment["kind"] == "file" and not attachment.get("text_excerpt"):
            text_sections.append(
                f"No inline text extraction is available for {attachment['name']}. Use the metadata and ask for a smaller text sample if needed."
            )

    text_block = {"type": "text", "text": "\n\n".join(text_sections).strip()}
    if multimodal_blocks:
        return [text_block, *multimodal_blocks]
    return text_block["text"]


def build_image_data_url(attachment: dict[str, Any]) -> str | None:
    if attachment.get("kind") != "image":
        return None

    if int(attachment.get("size_bytes") or 0) > settings.CHAT_IMAGE_ANALYSIS_MAX_BYTES:
        return None

    storage_name = attachment.get("storage_name")
    if not storage_name:
        return None

    storage_path = settings.CHAT_ATTACHMENT_DIR / storage_name
    if not storage_path.exists():
        return None

    media_type = attachment.get("media_type") or "image/png"
    encoded_bytes = base64.b64encode(storage_path.read_bytes()).decode("ascii")
    return f"data:{media_type};base64,{encoded_bytes}"


def _detect_media_type(filename: str, content_type: str | None) -> str:
    guessed_media_type = content_type or mimetypes.guess_type(filename)[0]
    return guessed_media_type or "application/octet-stream"


def _detect_attachment_kind(media_type: str, filename: str) -> str:
    lower_name = filename.lower()
    if media_type.startswith("image/"):
        return "image"
    if media_type.startswith("video/"):
        return "video"
    if media_type.startswith(TEXT_MEDIA_PREFIXES) or media_type in TEXT_MEDIA_TYPES:
        return "text"
    if Path(lower_name).suffix in TEXT_SUFFIXES:
        return "text"
    return "file"


def _build_text_excerpt(file_bytes: bytes, media_type: str, filename: str) -> str | None:
    if _detect_attachment_kind(media_type, filename) != "text":
        return None

    text_value = _decode_text(file_bytes)
    if not text_value:
        return None

    return text_value[: settings.CHAT_ATTACHMENT_MAX_TEXT_CHARS].strip() or None


def _decode_text(file_bytes: bytes) -> str | None:
    for encoding in ("utf-8", "utf-8-sig", "utf-16", "latin-1"):
        try:
            decoded = file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue

        normalized = re.sub(r"\s+", " ", decoded).strip()
        if normalized:
            return normalized

    return None


def _describe_attachment(attachment: dict[str, Any]) -> str:
    size_kb = max(1, int((int(attachment.get("size_bytes") or 0) + 1023) / 1024))
    return (
        f"- {attachment.get('kind', 'file').title()} attachment: {attachment.get('name', 'attachment')} "
        f"({attachment.get('media_type', 'application/octet-stream')}, {size_kb} KB)"
    )