from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.v1.dependencies import get_current_user_id
from core.database import get_db
from repositories import FlashcardRepository
from schemas import FlashcardResponse, ScoreCreate, UserScoreResponse

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.get("", response_model=list[FlashcardResponse])
async def get_flashcards(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    flashcard_repo = FlashcardRepository(db)
    return flashcard_repo.get_random_cards(limit)


@router.get("/score", response_model=UserScoreResponse)
async def get_score(
    user_id=Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    flashcard_repo = FlashcardRepository(db)
    return flashcard_repo.get_user_score(user_id)


@router.post("/score", response_model=UserScoreResponse)
async def record_score(
    score_create: ScoreCreate,
    user_id=Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    flashcard_repo = FlashcardRepository(db)
    return flashcard_repo.record_score(user_id, score_create.score)
