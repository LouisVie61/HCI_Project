import asyncio
import json
import logging
import re
import time
from collections import deque
from datetime import date
from urllib import parse, request

import google.generativeai as genai

from core.config import settings

logger = logging.getLogger(__name__)

VIETNAMESE_PATTERN = re.compile(
    r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]",
    re.IGNORECASE,
)
VIETNAMESE_WORD_PATTERN = re.compile(
    r"\b(xin|chao|chào|cam|cảm|on|ơn|toi|tôi|ban|bạn|khoe|khỏe|hom|hôm|nay|yeu|yêu)\b",
    re.IGNORECASE,
)


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

    async def translate_to_english(
        self,
        text: str,
        source_language: str | None = None,
    ) -> tuple[str, bool, str | None, str]:
        normalized_text = (text or "").strip()
        if not normalized_text:
            return "", False, None, "auto"

        normalized_text = normalized_text[:settings.GEMINI_MAX_INPUT_CHARS]
        resolved_source_language = self._resolve_source_language(
            normalized_text,
            source_language,
        )

        provider = settings.TEXT_TRANSLATION_PROVIDER.strip().lower()
        if provider not in {"none", "gemini"}:
            translated_text, error = await self._translate_to_english_with_provider(
                normalized_text,
                provider,
                resolved_source_language,
            )
            if translated_text:
                return translated_text, False, None, resolved_source_language
            logger.warning("Text translation provider failed: %s", error)

        if not await self.rate_limiter.try_acquire():
            message = "Gemini local free-tier limit reached"
            logger.info("%s; using source text for English translation", message)
            return normalized_text, True, message, resolved_source_language

        prompt = (
            "Translate the following text to natural English. "
            "Return only the translated English text, with no explanation.\n\n"
            f"Text: {normalized_text}\nEnglish:"
        )

        try:
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
            translated_text = (getattr(response, "text", "") or "").strip()
            if translated_text:
                return translated_text, False, None, resolved_source_language
            return normalized_text, True, "Gemini returned an empty translation", resolved_source_language
        except asyncio.TimeoutError:
            message = "Gemini English translation timed out"
            logger.warning("%s; using source text", message)
            return normalized_text, True, message, resolved_source_language
        except Exception as exc:
            message = f"Gemini English translation failed: {exc}"
            logger.warning("%s; using source text", message)
            return normalized_text, True, message, resolved_source_language

    async def _translate_to_english_with_provider(
        self,
        text: str,
        provider: str,
        source_language: str,
    ) -> tuple[str | None, str | None]:
        try:
            if provider == "libretranslate":
                return await asyncio.to_thread(self._translate_with_libretranslate, text, source_language)
            if provider == "mymemory":
                return await asyncio.to_thread(self._translate_with_mymemory, text, source_language)
            return None, f"Unsupported text translation provider: {provider}"
        except Exception as exc:
            return None, str(exc)

    def _translate_with_mymemory(self, text: str, source_language: str) -> tuple[str | None, str | None]:
        if source_language == "en":
            return text, None

        params = {
            "q": text,
            "langpair": f"{source_language}|en",
        }
        if settings.MYMEMORY_EMAIL:
            params["de"] = settings.MYMEMORY_EMAIL

        url = f"https://api.mymemory.translated.net/get?{parse.urlencode(params)}"
        with request.urlopen(url, timeout=settings.TEXT_TRANSLATION_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))

        if not isinstance(payload, dict):
            return None, "MyMemory returned an invalid response"

        if payload.get("responseStatus") not in {200, "200"}:
            return None, str(payload.get("responseDetails") or "MyMemory translation failed")

        translated_text = payload.get("responseData", {}).get("translatedText")
        if isinstance(translated_text, str) and translated_text.strip():
            return translated_text.strip(), None

        return None, "MyMemory returned an empty translation"

    def _translate_with_libretranslate(self, text: str, source_language: str) -> tuple[str | None, str | None]:
        if not settings.LIBRETRANSLATE_URL:
            return None, "LIBRETRANSLATE_URL is not configured"

        endpoint = settings.LIBRETRANSLATE_URL.rstrip("/") + "/translate"
        body = {
            "q": text,
            "source": source_language,
            "target": "en",
            "format": "text",
        }
        if settings.LIBRETRANSLATE_API_KEY:
            body["api_key"] = settings.LIBRETRANSLATE_API_KEY

        encoded_body = json.dumps(body).encode("utf-8")
        req = request.Request(
            endpoint,
            data=encoded_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with request.urlopen(req, timeout=settings.TEXT_TRANSLATION_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))

        translated_text = payload.get("translatedText") if isinstance(payload, dict) else None
        if isinstance(translated_text, str) and translated_text.strip():
            return translated_text.strip(), None

        return None, "LibreTranslate returned an empty translation"

    def _resolve_source_language(self, text: str, source_language: str | None) -> str:
        normalized_language = (source_language or "").strip().lower()
        if normalized_language and normalized_language != "auto":
            return normalized_language

        if VIETNAMESE_PATTERN.search(text) or VIETNAMESE_WORD_PATTERN.search(text):
            return "vi"

        return "en"

_translation_service_instance = TranslationService()


def get_translation_service() -> TranslationService:
    return _translation_service_instance
