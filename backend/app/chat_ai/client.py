from __future__ import annotations

import json
from collections.abc import Iterator
from typing import Any
from urllib import error, request

from core.config import settings


class OpenRouterChatClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.model = model or settings.OPENROUTER_MODEL
        self.base_url = (base_url or settings.OPENROUTER_BASE_URL).rstrip("/")

        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is not set. Add it to backend/app/.env before testing."
            )

    def _resolve_max_tokens(self, messages: list[dict[str, Any]]) -> int:
        context_window = max(1, settings.OPENROUTER_CONTEXT_WINDOW)
        max_output_tokens = min(settings.OPENROUTER_MAX_TOKENS, context_window)
        estimated_input_tokens = max(1, len(json.dumps(messages, ensure_ascii=False)) // 4)
        safety_margin = min(8192, max(1024, estimated_input_tokens // 8))
        available_tokens = context_window - estimated_input_tokens - safety_margin

        if available_tokens <= 0:
            raise RuntimeError(
                "OpenRouter request is too large for the configured context window. Reduce the prompt or attachments."
            )

        if available_tokens < 512:
            return available_tokens

        return min(max_output_tokens, available_tokens)

    def create_chat_completion(
        self,
        messages: list[dict[str, Any]],
        temperature: float = 0.7,
    ) -> dict[str, Any]:
        max_tokens = self._resolve_max_tokens(messages)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "reasoning": {"effort": settings.OPENROUTER_REASONING_EFFORT},
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-OpenRouter-Title": settings.OPENROUTER_APP_NAME,
        }

        req = request.Request(
            url=f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=settings.OPENROUTER_TIMEOUT_SECONDS) as response:
                raw_body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"OpenRouter HTTP {exc.code}: {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc.reason}") from exc

        parsed = json.loads(raw_body)
        choices = parsed.get("choices") or []
        message = choices[0].get("message", {}) if choices else {}

        return {
            "content": message.get("content", ""),
            "model": parsed.get("model", self.model),
            "usage": parsed.get("usage", {}),
            "raw": parsed,
        }

    def chat(
        self,
        user_message: str,
        system_prompt: str = "You are a concise and helpful AI assistant for a sign language learning project. Always reply in English unless the user explicitly requests another language.",
    ) -> dict[str, Any]:
        return self.create_chat_completion(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ]
        )

    def stream_chat_completion(
        self,
        messages: list[dict[str, Any]],
        temperature: float = 0.7,
    ) -> Iterator[dict[str, Any]]:
        max_tokens = self._resolve_max_tokens(messages)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "reasoning": {"effort": settings.OPENROUTER_REASONING_EFFORT},
            "stream": True,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-OpenRouter-Title": settings.OPENROUTER_APP_NAME,
        }

        req = request.Request(
            url=f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=settings.OPENROUTER_TIMEOUT_SECONDS) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line or not line.startswith("data:"):
                        continue

                    payload_text = line[5:].strip()
                    if payload_text == "[DONE]":
                        break

                    try:
                        parsed = json.loads(payload_text)
                    except json.JSONDecodeError:
                        continue

                    choices = parsed.get("choices") or []
                    delta = choices[0].get("delta", {}) if choices else {}

                    yield {
                        "content": delta.get("content", ""),
                        "raw": parsed,
                    }
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"OpenRouter HTTP {exc.code}: {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc.reason}") from exc