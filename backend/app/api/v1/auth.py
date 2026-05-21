from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from schemas import UserCreate, UserLogin, TokenResponse, UserResponse, ErrorResponse
from services import AuthService
from api.v1.dependencies import get_current_user
import traceback

router = APIRouter(prefix="/auth", tags=["auth"])


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


@router.post("/logout")
async def logout():
    """Logout user (token invalidation handled by client)"""
    return {"message": "Logged out successfully"}


@router.post("/signup-admin", response_model=TokenResponse)
async def signup_admin(
    user_create: UserCreate,
    admin_secret: str,
    db: Session = Depends(get_db),
):
    """
    POST /api/v1/auth/signup-admin?admin_secret=hci-admin-secret-2026
    """
    if admin_secret != settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin secret",
        )
    try:
        auth_service = AuthService(db)
        token_response = auth_service.signup(user_create)

        from repositories import UserRepository
        user_repo = UserRepository(db)
        user = user_repo.get_by_email(user_create.email)
        user.role = "admin"
        db.commit()
        db.refresh(user)

        from schemas import UserResponse as UR
        token_response.user = UR.from_orm(user)
        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )
