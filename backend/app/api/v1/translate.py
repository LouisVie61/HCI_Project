import logging
from fastapi import APIRouter, HTTPException, Depends
from schemas.translation import TranslationRequest, TranslationResponse
from services.translation import TranslationService, get_translation_service

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

@router.post("/", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """Translate text to sign language glosses"""
    try:
        glosses_sequence = await service.translate(request.text)
        logger.info(f"Translation success: {glosses_sequence}")
        return TranslationResponse(sequence=glosses_sequence)
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))