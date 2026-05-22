import logging
from contextlib import asynccontextmanager
from pathlib import Path
from sqlalchemy import inspect, text
from core.logging_config import setup_logging
setup_logging()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from core.database import Base, engine
from core.migrations import ensure_user_profile_columns
import models  # noqa: F401
from api.v1.router import router
from middleware.LoggingMiddleware import LoggingMiddleware
from services.chat_attachments import ensure_attachment_dirs
from services.translation import get_translation_service

logger = logging.getLogger(__name__)
logger.info(f"Database: {settings.DATABASE_URL}")
Base.metadata.create_all(bind=engine)
ensure_user_profile_columns(engine)
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def ensure_chat_schema() -> None:
    ensure_attachment_dirs()
    inspector = inspect(engine)
    if "chat_messages" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("chat_messages")}
    if "attachments_json" in column_names:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE chat_messages ADD COLUMN attachments_json TEXT"))


ensure_chat_schema()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Application startup started")
    
    # Pre-initialize Translation Service to avoid first-request latency
    logger.info("Pre-initializing Translation Service...")
    get_translation_service()
    logger.info("Translation Service pre-initialized")
    
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"CORS Origins: {settings.CORS_ORIGINS}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Application shutdown started")
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

logger.info(f"✓ Starting {settings.APP_NAME} v{settings.APP_VERSION}")

app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(router)

@app.get("/")
async def root():
    logger.info("GET / - Root endpoint")
    return {"message": "Sign Language Support System API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
    )
