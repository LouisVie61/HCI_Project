from pydantic import BaseModel
from typing import List

class TranslationRequest(BaseModel):
    text: str

class GlossItem(BaseModel):
    gloss: str

class TranslationResponse(BaseModel):
    """Response format theo chuẩn của hệ thống ngôn ngữ ký hiệu"""
    sequence: List[GlossItem]
