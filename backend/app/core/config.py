from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "Sign Language Support System"
    APP_VERSION: str = "0.0.1"
    DEBUG: bool = True

    DATABASE_URL: str

    SECRET_KEY: str
    ADMIN_SECRET: str = "change-this-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080 

    GOOGLE_API_KEY: str
    GOOGLE_CLIENT_ID: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: int = 4
    GEMINI_FREE_TIER_RPM_LIMIT: int = 10
    GEMINI_FREE_TIER_RPD_LIMIT: int = 900
    GEMINI_MAX_INPUT_CHARS: int = 500
    GEMINI_MAX_OUTPUT_TOKENS: int = 96

    TEXT_TRANSLATION_PROVIDER: str = "mymemory"
    TEXT_TRANSLATION_TIMEOUT_SECONDS: int = 8
    LIBRETRANSLATE_URL: str = ""
    LIBRETRANSLATE_API_KEY: str = ""
    MYMEMORY_EMAIL: str = ""

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-5-nano"
    OPENROUTER_TIMEOUT_SECONDS: int = 30
    OPENROUTER_CONTEXT_WINDOW: int = 400_000
    OPENROUTER_MAX_TOKENS: int = 400_000
    OPENROUTER_REASONING_EFFORT: str = "low"
    OPENROUTER_SITE_URL: str = "http://localhost:5173"
    OPENROUTER_APP_NAME: str = "HCI Project"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    CHAT_ATTACHMENT_DIR: Path = BASE_DIR / "uploads" / "chat"
    CHAT_ATTACHMENT_MAX_FILES: int = 5
    CHAT_ATTACHMENT_MAX_FILE_BYTES: int = 15 * 1024 * 1024
    CHAT_ATTACHMENT_MAX_TEXT_CHARS: int = 4000
    CHAT_IMAGE_ANALYSIS_MAX_BYTES: int = 5 * 1024 * 1024

    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    CORS_ORIGIN_REGEX: str = r"https?://(localhost|127\.0\.0\.1):\d+"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_mode(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"dev", "development"}:
                return True
        return value

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
