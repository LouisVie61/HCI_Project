from sqlalchemy.orm import Session
from app.models import User
from app.core.security import hash_password, verify_password
from uuid import UUID


class UserRepository:
    """User data access layer"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, email: str, password: str) -> User:
        """Create a new user"""
        user = User(
            email=email,
            password_hash=hash_password(password),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_email(self, email: str) -> User | None:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: UUID) -> User | None:
        """Get user by id"""
        return self.db.query(User).filter(User.id == user_id).first()

    def verify_password(self, user: User, password: str) -> bool:
        """Verify user password"""
        return verify_password(password, user.password_hash)
