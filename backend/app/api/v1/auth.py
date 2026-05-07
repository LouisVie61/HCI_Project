from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import UserCreate, UserLogin, TokenResponse, UserResponse, ErrorResponse
from app.services import AuthService
from app.api.v1.dependencies import get_current_user
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
