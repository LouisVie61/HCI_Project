"""
Translation Handler - Tầng xử lý business logic cho Text-to-Sign translation.

Kiến trúc:
- Router (API Endpoint) -> Handler -> Service -> LLM Pipeline
"""

from schemas.translation import TranslationResponse
from services.translation import TranslationService


class TranslationHandler:
    """
    Handler xử lý logic nghiệp vụ cho translation flow.
    Tách biệt giữa API layer và service layer.
    """
    
    def __init__(self, service: TranslationService):
        self.service = service
    
    async def handle_text_to_sign(self, text: str) -> TranslationResponse:
        """
        Xử lý request Text-to-Sign.
        
        Quy trình:
        1. Validate input text
        2. Gọi translation service
        3. Format response
        4. Return response model
        """
        if not text or not text.strip():
            return TranslationResponse(sequence=[])
        glosses_sequence = await self.service.translate(text.strip())
        return TranslationResponse(sequence=glosses_sequence)
