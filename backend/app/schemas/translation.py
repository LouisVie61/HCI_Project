from pydantic import BaseModel


class TranslationRequest(BaseModel):
    text: str
    source_language: str | None = None


class EnglishTranslationResponse(BaseModel):
    original: str
    translated_text: str
    source_language: str = "auto"
    used_fallback: bool = False
    error: str | None = None

