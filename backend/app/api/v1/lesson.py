from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from core.database import get_db
from services.lesson import LessonService
from schemas.lesson import (
    LessonCreate, LessonResponse, LessonDetailResponse,
    ProgressUpdate, ProgressResponse,
)
from api.v1.dependencies import get_current_user
router = APIRouter(prefix="/lessons", tags=["Lessons"])

@router.get("/me/all-progress", response_model = list[ProgressResponse])
async def get_all_my_progress(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LessonService(db)
    return service.get_all_progress(current_user.id)

@router.get("/", response_model=list[LessonResponse])
async def get_lessons(
    search: str | None = Query(default=None),
    difficulty: str | None = Query(default=None, pattern="^(beginner|intermediate|advanced)$"),
    db: Session = Depends(get_db),
):
    service = LessonService(db)
    return service.get_lessons(search=search, difficulty=difficulty)

@router.get("/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson_detail(lesson_id: UUID, db: Session = Depends(get_db)):
    try:
        service = LessonService(db)
        return service.get_lesson_detail(lesson_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{lesson_id}/start", response_model=ProgressResponse)
async def start_lesson(
    lesson_id: UUID,
    current_user = Depends(get_current_user), #bat buoc phai dang nhap
    db: Session = Depends(get_db),
):
    try:
        service = LessonService(db)
        return service.start_lesson(current_user.id, lesson_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{lesson_id}/progress", response_model=ProgressResponse)
async def update_progress(
    lesson_id: UUID,
    body: ProgressUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        service = LessonService(db)
        return service.update_progress(current_user.id, lesson_id, body.progress_percent)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{lesson_id}/progress", response_model=ProgressResponse)
async def get_progress(
    lesson_id: UUID,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LessonService(db)
    progress = service.get_progress(current_user.id, lesson_id)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No progress found. Please start the lesson first.",
        )
    return progress

@router.post("/{lesson_id}/restart", response_model=ProgressResponse)
async def restart_lesson(
    lesson_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Học lại từ đầu — reset về 0%"""
    try:
        service = LessonService(db)
        return service.restart_lesson(current_user.id, lesson_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=LessonResponse, status_code=201)
async def create_lesson(
    body: LessonCreate,
    current_user=Depends(get_current_user),   # bắt buộc đăng nhập
    db: Session = Depends(get_db),
):
    """Tạo bài học mới — chỉ admin"""
    if current_user.role != "admin": # kiểm tra role
        raise HTTPException(status_code=403, detail="Admin only")
    service = LessonService(db)
    return service.create_lesson(body)
