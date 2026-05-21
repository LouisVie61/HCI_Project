from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Flashcard, UserFlashcardScore


DEFAULT_FLASHCARDS = [
    {"word": "Hello", "sign_data": {"label": "👋", "description": "Greeting"}},
    {"word": "Thank you", "sign_data": {"label": "🙏", "description": "Thanks"}},
    {"word": "Love", "sign_data": {"label": "❤️", "description": "Love"}},
    {"word": "Yes", "sign_data": {"label": "👍", "description": "Agreement"}},
    {"word": "No", "sign_data": {"label": "✋", "description": "Refusal"}},
    {"word": "Learn", "sign_data": {"label": "📘", "description": "Study"}},
    {"word": "Friend", "sign_data": {"label": "🤝", "description": "Friend"}},
    {"word": "Help", "sign_data": {"label": "🙌", "description": "Help"}},
]


class FlashcardRepository:
    def __init__(self, db: Session):
        self.db = db

    def seed_defaults_if_empty(self) -> None:
        if self.db.query(Flashcard).first():
            return

        self.db.add_all(
            Flashcard(word=item["word"], sign_data=item["sign_data"])
            for item in DEFAULT_FLASHCARDS
        )
        self.db.commit()

    def get_random_cards(self, limit: int) -> list[Flashcard]:
        self.seed_defaults_if_empty()
        return (
            self.db.query(Flashcard)
            .order_by(func.random())
            .limit(limit)
            .all()
        )

    def get_user_score(self, user_id: UUID) -> UserFlashcardScore:
        score = (
            self.db.query(UserFlashcardScore)
            .filter(UserFlashcardScore.user_id == user_id)
            .first()
        )

        if score:
            return score

        score = UserFlashcardScore(user_id=user_id, total_score=0, attempts=0)
        self.db.add(score)
        self.db.commit()
        self.db.refresh(score)
        return score

    def record_score(
        self,
        user_id: UUID,
        score: int,
    ) -> UserFlashcardScore:
        user_score = self.get_user_score(user_id)
        user_score.total_score += score
        user_score.attempts += 1
        self.db.commit()
        self.db.refresh(user_score)
        return user_score
