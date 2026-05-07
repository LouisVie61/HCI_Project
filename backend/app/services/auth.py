from sqlalchemy.orm import Session
from datetime import timedelta
from app.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from app.repositories import UserRepository
from app.core.security import create_access_token
from app.core.config import settings


class AuthService:
    """Authentication business logic"""

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def signup(self, user_create: UserCreate) -> TokenResponse:
        """Create a new user account"""
        # Check if user exists
        existing_user = self.user_repo.get_by_email(user_create.email)
        if existing_user:
            raise ValueError("Email already registered")

        # Create user
        user = self.user_repo.create(user_create.email, user_create.password)

        # Create token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return TokenResponse(
            access_token=access_token,
            user=UserResponse.from_orm(user),
        )

    def login(self, user_login: UserLogin) -> TokenResponse:
        """Login user"""
        # Get user
        user = self.user_repo.get_by_email(user_login.email)
        if not user:
            raise ValueError("Invalid email or password")

        # Verify password
        if not self.user_repo.verify_password(user, user_login.password):
            raise ValueError("Invalid email or password")

        # Create token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return TokenResponse(
            access_token=access_token,
            user=UserResponse.from_orm(user),
        )

    def get_current_user(self, token: str) -> UserResponse:
        """Get current user from token"""
        from app.core.security import decode_token

        payload = decode_token(token)
        if not payload:
            raise ValueError("Invalid token")

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        return UserResponse.from_orm(user)
