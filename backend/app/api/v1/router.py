from fastapi import APIRouter
from api.v1 import auth, translate

router = APIRouter(prefix="/api/v1")

# Include routers
router.include_router(auth.router)
router.include_router(translate.router, prefix="/translation", tags=["Translation"])
router.include_router(translate.router, prefix="/translateText", tags=["Translation"])
