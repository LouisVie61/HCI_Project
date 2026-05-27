from uuid import UUID
from urllib.parse import quote

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from models import Flashcard, UserFlashcardScore


MEDIA_KEYS = ("video_url", "mp4_url", "video_mp4", "video_src", "media_url", "src")
MEDIA_BASE_URL = "http://127.0.0.1:8000/media/flashcards"


def flashcard_video_url(filename: str) -> str:
    return f"{MEDIA_BASE_URL}/{quote(filename)}"


def is_video_file_url(url: str | None) -> bool:
    if not url:
        return False

    clean_url = url.split("?")[0].lower()
    return clean_url.endswith((".mp4", ".webm", ".ogg"))


def has_media_url(sign_data: dict | None) -> bool:
    if not isinstance(sign_data, dict):
        return False

    return any(is_video_file_url(str(sign_data.get(key) or "")) for key in MEDIA_KEYS)


DEFAULT_FLASHCARDS = [
    {
        "word": "gà",
        "sign_data": {
            "mp4_url": flashcard_video_url("gà_-_2232_-_tudienngonngukyhieu_v1 (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/ga-2232",
            "description": "Ký hiệu cho từ gà",
        },
    },
    {
        "word": "tivi",
        "sign_data": {
            "mp4_url": flashcard_video_url("ti_vi_-_1492_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/ti-vi-1492",
            "description": "Ký hiệu cho từ tivi",
        },
    },
    {
        "word": "máy cày",
        "sign_data": {
            "mp4_url": flashcard_video_url("máy_cày_-_1399_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/may-cay-1399",
            "description": "Ký hiệu cho từ máy cày",
        },
    },
    {
        "word": "lắc",
        "sign_data": {
            "mp4_url": flashcard_video_url("lắc_-_1383_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/lac-1383",
            "description": "Ký hiệu cho từ lắc",
        },
    },
    {
        "word": "màn hình",
        "sign_data": {
            "mp4_url": flashcard_video_url("màn_hình_-_441_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/man-hinh-441",
            "description": "Ký hiệu cho từ màn hình",
        },
    },
    {
        "word": "mật khẩu",
        "sign_data": {
            "mp4_url": flashcard_video_url("mật_khẩu_-_117_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/mat-khau-117",
            "description": "Ký hiệu cho từ mật khẩu",
        },
    },
    {
        "word": "sao chép",
        "sign_data": {
            "mp4_url": flashcard_video_url("sao_chép_-_146_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/sao-chep-146",
            "description": "Ký hiệu cho từ sao chép",
        },
    },
    {
        "word": "bàn phím",
        "sign_data": {
            "mp4_url": flashcard_video_url("bàn_phím_-_437_-_tudienngonngukyhieu (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/ban-phim-437",
            "description": "Ký hiệu cho từ bàn phím",
        },
    },
    {
        "word": "treo máy",
        "sign_data": {
            "mp4_url": flashcard_video_url("treo_máy_-_155_-_tudienngonngukyhieu_v1 (240p).mp4"),
            "source_url": "https://ngonngukyhieu.com/tu-ngu/treo-may-155",
            "description": "Ký hiệu cho từ treo máy",
        },
    },
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

    def sync_default_flashcards(self) -> None:
        changed = False

        for item in DEFAULT_FLASHCARDS:
            existing_card = (
                self.db.query(Flashcard)
                .filter(Flashcard.word == item["word"])
                .first()
            )

            if existing_card:
                # Keep user-supplied MP4/WebM/Ogg media. Only clean up old page URLs.
                if has_media_url(existing_card.sign_data):
                    continue

                if existing_card.sign_data != item["sign_data"]:
                    existing_card.sign_data = item["sign_data"]
                    changed = True
                continue

            self.db.add(Flashcard(word=item["word"], sign_data=item["sign_data"]))
            changed = True

        if changed:
            self.db.commit()

    def get_random_cards(self, limit: int) -> list[Flashcard]:
        self.sync_default_flashcards()

        candidates = (
            self.db.query(Flashcard)
            .filter(or_(*(Flashcard.sign_data.op("?")(key) for key in MEDIA_KEYS)))
            .order_by(func.random())
            .all()
        )

        return [card for card in candidates if has_media_url(card.sign_data)][:limit]

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
