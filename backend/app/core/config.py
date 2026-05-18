from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Sign Language Support System"
    APP_VERSION: str = "0.0.1"
    DEBUG: bool = True

    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080 

    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: int = 4
    GEMINI_FREE_TIER_RPM_LIMIT: int = 10
    GEMINI_FREE_TIER_RPD_LIMIT: int = 900
    GEMINI_MAX_INPUT_CHARS: int = 500
    GEMINI_MAX_OUTPUT_TOKENS: int = 96

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
