import asyncio
import logging
import re
import time
from collections import deque
from datetime import date

import google.generativeai as genai

from core.config import settings
from prompts.translation import build_translation_prompt

logger = logging.getLogger(__name__)


class FreeTierRateLimiter:
    def __init__(self, rpm_limit: int, rpd_limit: int):
        self.rpm_limit = rpm_limit
        self.rpd_limit = rpd_limit
        self._minute_requests = deque()
        self._day = date.today()
        self._day_count = 0
        self._lock = asyncio.Lock()

    async def try_acquire(self) -> bool:
        async with self._lock:
            today = date.today()
            if today != self._day:
                self._day = today
                self._day_count = 0
                self._minute_requests.clear()

            now = time.monotonic()
            while self._minute_requests and now - self._minute_requests[0] >= 60:
                self._minute_requests.popleft()

            if len(self._minute_requests) >= self.rpm_limit:
                return False
            if self._day_count >= self.rpd_limit:
                return False

            self._minute_requests.append(now)
            self._day_count += 1
            return True


class TranslationService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        self.rate_limiter = FreeTierRateLimiter(
            rpm_limit=settings.GEMINI_FREE_TIER_RPM_LIMIT,
            rpd_limit=settings.GEMINI_FREE_TIER_RPD_LIMIT,
        )

    async def translate(self, text: str) -> list[dict]:
        normalized_text = (text or "").strip()
        if not normalized_text:
            return []

        normalized_text = normalized_text[:settings.GEMINI_MAX_INPUT_CHARS]

        if not await self.rate_limiter.try_acquire():
            logger.info("Gemini local free-tier limit reached; using fallback")
            return self._fallback_sequence(normalized_text)

        try:
            content = await self._call_gemini(normalized_text)
            sequence = self._parse_sequence(content)
            if sequence:
                return sequence

            logger.warning("Gemini returned empty glosses; using fallback")
        except asyncio.TimeoutError:
            logger.warning("Gemini request timed out; using fallback")
        except Exception as exc:
            logger.warning("Gemini request failed; using fallback: %s", exc)

        return self._fallback_sequence(normalized_text)

    async def _call_gemini(self, text: str) -> str:
        prompt = build_translation_prompt(text)
        response = await asyncio.wait_for(
            self.model.generate_content_async(
                prompt,
                generation_config={
                    "temperature": 0,
                    "max_output_tokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
                },
                request_options={"timeout": settings.GEMINI_TIMEOUT_SECONDS},
            ),
            timeout=settings.GEMINI_TIMEOUT_SECONDS,
        )
        return (getattr(response, "text", "") or "").strip()

    def _parse_sequence(self, content: str) -> list[dict]:
        if not content:
            return []

        glosses = []
        for item in re.split(r"[,;\n]+", content):
            gloss = item.strip().strip("-*0123456789. )(").upper()
            if gloss:
                glosses.append(gloss)

        return [{"gloss": gloss} for gloss in glosses]

    def _fallback_sequence(self, text: str) -> list[dict]:
        glosses = [token.upper() for token in re.findall(r"\w+", text, re.UNICODE)]
        return [{"gloss": gloss} for gloss in glosses]


_translation_service_instance = TranslationService()


def get_translation_service() -> TranslationService:
    return _translation_service_instance
