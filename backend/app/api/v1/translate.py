import logging
from fastapi import APIRouter, HTTPException, Depends
from schemas.translation import TranslationRequest, TranslationResponse
from services.translation import TranslationService, get_translation_service

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

async def _translate_request(
    request: TranslationRequest,
    service: TranslationService,
) -> TranslationResponse:
    glosses_sequence = await service.translate(request.text)
    logger.info(f"Translation success: {glosses_sequence}")
    return TranslationResponse(sequence=glosses_sequence)


@router.post("/text-to-sign", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """Translate text to sign language glosses"""
    try:
        return await _translate_request(request, service)
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=TranslationResponse)
async def translate_text_legacy(
    request: TranslationRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """Legacy Text-to-Sign endpoint."""
    try:
        return await _translate_request(request, service)
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
