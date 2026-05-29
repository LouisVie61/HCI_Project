from sqlalchemy.orm import Session
from datetime import timedelta
from urllib import parse, request
import json
from uuid import uuid4

from schemas import UserCreate, UserLogin, UserUpdate, TokenResponse, UserResponse
from repositories import UserRepository
from core.security import create_access_token
from core.config import settings


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
        user = self.user_repo.create(
            user_create.email,
            user_create.password,
            user_create.full_name,
        )

        return self._create_token_response(user)

    def google_auth(self, credential: str) -> TokenResponse:
        """Create or login a user using a Google ID token credential."""
        if not settings.GOOGLE_CLIENT_ID:
            raise ValueError("Google sign-up is not configured")

        profile = self._verify_google_credential(credential)
        email = profile.get("email", "").strip().lower()
        full_name = (profile.get("name") or email.split("@")[0]).strip()
        avatar_url = profile.get("picture")

        if not email:
            raise ValueError("Google account did not provide an email")

        user = self.user_repo.get_by_email(email)
        if not user:
            user = self.user_repo.create(
                email=email,
                password=uuid4().hex + uuid4().hex,
                full_name=full_name,
            )
            if avatar_url:
                user.avatar_url = avatar_url
                self.db.add(user)
                self.db.commit()
                self.db.refresh(user)
        elif not user.full_name and full_name:
            user.full_name = full_name
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

        return self._create_token_response(user)

    def _verify_google_credential(self, credential: str) -> dict:
        params = parse.urlencode({"id_token": credential})
        url = f"https://oauth2.googleapis.com/tokeninfo?{params}"

        try:
            with request.urlopen(url, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise ValueError(f"Google credential verification failed: {exc}") from exc

        if payload.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise ValueError("Google credential audience is invalid")
        if payload.get("email_verified") not in {"true", True}:
            raise ValueError("Google email is not verified")

        return payload

    def _create_token_response(self, user) -> TokenResponse:
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

        return self._create_token_response(user)

    def get_current_user(self, token: str) -> UserResponse:
        """Get current user from token"""
        from core.security import decode_token

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

    def update_profile(self, current_user, user_update: UserUpdate) -> UserResponse:
        """Update current user's profile"""
        if user_update.email:
            existing_user = self.user_repo.get_by_email(user_update.email)
            if existing_user and existing_user.id != current_user.id:
                raise ValueError("Email already registered")

        if user_update.phone_number:
            existing_user = self.user_repo.get_by_phone_number(user_update.phone_number)
            if existing_user and existing_user.id != current_user.id:
                raise ValueError("Phone number already registered")

        updated_user = self.user_repo.update_profile(current_user, user_update)
        return UserResponse.from_orm(updated_user)

    def update_avatar(self, current_user, avatar_url: str) -> UserResponse:
        """Update current user's avatar URL"""
        user_update = UserUpdate(avatar_url=avatar_url)
        updated_user = self.user_repo.update_profile(current_user, user_update)
        return UserResponse.from_orm(updated_user)
