import logging
from fastapi import APIRouter, HTTPException, Depends
from schemas.translation import EnglishTranslationResponse, TranslationRequest
from services.translation import TranslationService, get_translation_service

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.post("/to-english", response_model=EnglishTranslationResponse)
async def translate_to_english(
    request: TranslationRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """Translate user input to English before calling SignMT."""
    try:
        source_text = request.text.strip()
        translated_text, used_fallback, error, source_language = await service.translate_to_english(
            source_text,
            request.source_language,
        )
        return EnglishTranslationResponse(
            original=source_text,
            translated_text=translated_text,
            source_language=source_language,
            used_fallback=used_fallback,
            error=error,
        )
    except Exception as e:
        logger.error(f"English translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

