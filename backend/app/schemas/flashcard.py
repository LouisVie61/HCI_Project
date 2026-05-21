from uuid import UUID

from pydantic import BaseModel, Field


class FlashcardResponse(BaseModel):
    id: UUID
    word: str
    sign_data: dict

    class Config:
        from_attributes = True


class ScoreCreate(BaseModel):
    score: int = Field(ge=0)
    total: int = Field(gt=0)


class UserScoreResponse(BaseModel):
    user_id: UUID
    total_score: int
    attempts: int

    class Config:
        from_attributes = True
