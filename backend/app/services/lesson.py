from sqlalchemy.orm import Session
from uuid import UUID
from schemas.lesson import LessonCreate
from repositories.lesson import LessonRepository, ProgressRepository


class LessonService:
    def __init__(self, db: Session):
        self.db = db
        self.lesson_repo = LessonRepository(db)
        self.progress_repo = ProgressRepository(db)

    def get_lessons(self, search: str | None = None, difficulty: str | None = None) -> list:
        return self.lesson_repo.get_all_published(search=search, difficulty=difficulty)

    def get_lesson_detail(self, lesson_id: UUID):
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise ValueError("Lesson not found")
        return lesson

    def start_lesson(self, user_id: UUID, lesson_id: UUID):
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise ValueError("Lesson not found")
        if not lesson.is_published:
            raise ValueError("Lesson is not available")
        return self.progress_repo.start_lesson(user_id, lesson_id)

    def update_progress(self, user_id: UUID, lesson_id: UUID, percent: float):
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise ValueError("Lesson not found")
        progress = self.progress_repo.update_progress(user_id, lesson_id, percent)  # fix: thêm percent

        if not progress:
            raise ValueError("Please start the lesson first.")
        return progress

    def get_progress(self, user_id: UUID, lesson_id: UUID):
        return self.progress_repo.get_progress(user_id, lesson_id)

    def get_all_progress(self, user_id: UUID):
        return self.progress_repo.get_all_by_user(user_id)

    def restart_lesson(self, user_id: UUID, lesson_id: UUID):
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise ValueError("Lesson not found")
        return self.progress_repo.restart_lesson(user_id, lesson_id)

    def create_lesson(self, body: LessonCreate):
        return self.lesson_repo.create(body.model_dump())
