import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

logger = logging.getLogger("api")


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        logger.info(
            f"Incoming request: {request.method} {request.url.path}"
        )

        response = await call_next(request)

        process_time = time.time() - start_time

        logger.info(
            f"Completed: {request.method} "
            f"{request.url.path} "
            f"Status={response.status_code} "
            f"Time={process_time:.4f}s"
        )

        return response