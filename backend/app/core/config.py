from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings"""

    # App
    APP_NAME: str = "Sign Language Support System"
    APP_VERSION: str = "0.0.1"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Database - Read from .env file
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://hci_user:hci_password@localhost:5432/hci_db"
    )

    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-change-in-production"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
