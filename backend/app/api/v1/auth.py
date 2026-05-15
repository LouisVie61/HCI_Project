from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from core.database import get_db
from schemas import UserCreate, UserLogin, UserUpdate, TokenResponse, UserResponse, ErrorResponse
from services import AuthService
from api.v1.dependencies import get_current_user
import traceback

router = APIRouter(prefix="/auth", tags=["auth"])

AVATAR_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "avatars"
MAX_AVATAR_SIZE = 2 * 1024 * 1024
ALLOWED_AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@router.post("/signup", response_model=TokenResponse)
async def signup(
    user_create: UserCreate,
    db: Session = Depends(get_db),
):
    """Sign up a new user"""
    try:
        auth_service = AuthService(db)
        return auth_service.signup(user_create)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        print(f"Signup error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    user_login: UserLogin,
    db: Session = Depends(get_db),
):
    """Login user"""
    try:
        print(f"Login attempt: {user_login.email}")
        auth_service = AuthService(db)
        return auth_service.login(user_login)
    except ValueError as e:
        print(f"Login validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        print(f"Login error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user=Depends(get_current_user),
):
    """Get current user info"""
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_info(
    user_update: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile"""
    try:
        auth_service = AuthService(db)
        return auth_service.update_profile(current_user, user_update)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/me/avatar", response_model=UserResponse)
async def upload_current_user_avatar(
    avatar: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload and update current user's avatar"""
    if avatar.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be a JPG, PNG, or WebP image",
        )

    content = await avatar.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar image must be 2MB or smaller",
        )

    AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    extension = ALLOWED_AVATAR_TYPES[avatar.content_type]
    filename = f"{current_user.id}-{uuid4().hex}{extension}"
    file_path = AVATAR_UPLOAD_DIR / filename
    file_path.write_bytes(content)

    avatar_url = f"/uploads/avatars/{filename}"

    try:
        auth_service = AuthService(db)
        return auth_service.update_avatar(current_user, avatar_url)
    except Exception as e:
        print(f"Upload avatar error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


@router.post("/logout")
async def logout():
    """Logout user (token invalidation handled by client)"""
    return {"message": "Logged out successfully"}
