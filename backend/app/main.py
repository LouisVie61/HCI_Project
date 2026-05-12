import logging
from contextlib import asynccontextmanager
from core.logging_config import setup_logging
setup_logging()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import Base, engine
from api.v1.router import router
from middleware.LoggingMiddleware import LoggingMiddleware
from services.translation import get_translation_service

logger = logging.getLogger(__name__)
logger.info(f"Database: {settings.DATABASE_URL}")
Base.metadata.create_all(bind=engine)


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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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