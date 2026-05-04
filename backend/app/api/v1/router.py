from fastapi import APIRouter
from app.api.v1 import auth

router = APIRouter(prefix="/api/v1")

# Include routers
router.include_router(auth.router)
