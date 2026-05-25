from sqlalchemy import or_
from sqlalchemy.orm import Session
from models.lesson import Lesson, LessonProgress
from uuid import UUID
from datetime import datetime
from typing import Optional


class LessonRepository:

    def __init__(self, db: Session):
            self.db = db

    def get_all_published(
        self,
        search: Optional[str] = None,
        difficulty: Optional[str] = None,
    ) -> list[Lesson]:
        # SQL: SELECT * FROM lessons WHERE is_published=TRUE ...
        query = self.db.query(Lesson).filter(Lesson.is_published == True)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Lesson.title.ilike(search_pattern),
                    Lesson.description.ilike(search_pattern),
                )
            )

        if difficulty:
            query = query.filter(Lesson.difficulty == difficulty)

        return query.order_by(Lesson.order_index).all()


    def get_by_id(self, lesson_id: UUID) -> Optional[Lesson]:
        # SQL: SELECT * FROM lessons WHERE id=:id LIMIT 1
        return (
            self.db.query(Lesson)
            .filter(Lesson.id == lesson_id)
            .first()
        )

    def create(self, lesson_data: dict) -> Lesson:
        lesson = Lesson(**lesson_data)  # fix: Lesson (hoa) thay vì lesson (thường)
        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        return lesson


class ProgressRepository:

    def __init__(self, db: Session):
            self.db = db

    def get_progress(self, user_id: UUID, lesson_id: UUID) -> Optional[LessonProgress]:
        return (
            self.db.query(LessonProgress)
            .filter(
                LessonProgress.user_id == user_id,
                LessonProgress.lesson_id == lesson_id,
            )
            .first()
        )

    def get_all_by_user(self, user_id: UUID) -> list[LessonProgress]:
        return (
            self.db.query(LessonProgress)
            .filter(LessonProgress.user_id == user_id)
            .all()
        )

    def start_lesson(self, user_id: UUID, lesson_id: UUID) -> LessonProgress:
        #TH1: chua co record -> tao moi
        #TH2: da co record -> chi cap nhat last_accessed_at

        progress = self.get_progress(user_id, lesson_id)
        now = datetime.utcnow()

        if progress is None:
            progress = LessonProgress(
                user_id = user_id,
                lesson_id = lesson_id,
                status = "in_progress",
                progress_percent = 0.0,
                started_at = now,
                last_accessed_at = now,
            )
            self.db.add(progress)
        else:
            #hoc tiep chi cap nhat thoi gian truy cap
            progress.last_accessed_at = now
            if progress.status == "not_started":
                progress.status = "in_progress"
                progress.started_at = now

        self.db.commit()
        self.db.refresh(progress)
        return progress


    def update_progress(self, user_id: UUID, lesson_id: UUID, percent: float) -> Optional[LessonProgress]:
        #cap nhat % trong luc hoc, tu dong completed khi hoan thanh 100%
        progress = self.get_progress(user_id, lesson_id)
        if not progress:
            return None

        progress.progress_percent = percent
        progress.last_accessed_at = datetime.utcnow()

        if percent >= 100.0:
            progress.status = "completed"
            progress.completed_at = datetime.utcnow()

        elif progress.status != "completed":
            progress.status = "in_progress"

        self.db.commit()
        self.db.refresh(progress)
        return progress

    def restart_lesson(self, user_id: UUID, lesson_id: UUID) -> LessonProgress:
        #hoc lai tu dau percent = 0%
        progress = self.get_progress(user_id, lesson_id)
        now = datetime.utcnow()

        if progress is None:
            progress = LessonProgress(
                user_id = user_id,
                lesson_id = lesson_id,
                status = "in_progress",
                progress_percent = 0.0,
                started_at = now,
                last_accessed_at = now,
            )
            self.db.add(progress)

        else:
            progress.status = "in_progress"
            progress.progress_percent = 0.0
            progress.started_at = now
            progress.completed_at = None #Xoa moc hoan thanh
            progress.last_accessed_at = now

        self.db.commit()
        self.db.refresh(progress)
        return progress
