import re
from pydantic import BaseModel, field_validator
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized_email = value.strip().lower()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", normalized_email):
            raise ValueError("Email is invalid")
        return normalized_email


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must include at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must include at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must include at least one number")
        return value


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    avatar_url: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_name = value.strip()
        if not normalized_name:
            raise ValueError("Full name cannot be empty")
        if len(normalized_name) > 120:
            raise ValueError("Full name must be 120 characters or fewer")
        return normalized_name

    @field_validator("email")
    @classmethod
    def validate_optional_email(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_email = value.strip().lower()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", normalized_email):
            raise ValueError("Email is invalid")
        return normalized_email

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized_phone = value.strip()
        if not normalized_phone:
            return None
        if not re.match(r"^\+?[0-9]{9,15}$", normalized_phone):
            raise ValueError("Phone number must contain 9 to 15 digits and may start with +")
        return normalized_phone


class UserResponse(UserBase):
    id: UUID
    full_name: str | None = None
    phone_number: str | None = None
    avatar_url: str | None = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ErrorResponse(BaseModel):
    detail: str
    error_code: str = "ERROR"
