import time
import logging
import json
from datetime import datetime
from typing import Callable, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    MAX_BODY_LENGTH = 1000
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)
    
        start_time = time.time()
        request_info = await self._extract_request_info(request)
        
        logger.info(
            f"→ REQUEST | {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "headers": dict(request.headers),
            }
        )
        
        response = None
        status_code = 500
        error_msg = None
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            error_msg = str(e)
            logger.error(
                f"✗ ERROR | {request.method} {request.url.path} | {error_msg}",
                exc_info=True,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "error": error_msg,
                }
            )
            raise
        
        process_time = time.time() - start_time
        logger.info(
            f"← RESPONSE | {request.method} {request.url.path} | "
            f"Status: {status_code} | Time: {process_time:.3f}s",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "process_time": process_time,
            }
        )
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request.headers.get("X-Request-ID", "unknown")
        return response
    
    async def _extract_request_info(self, request: Request) -> dict:
        body = None
        if request.method not in self.SAFE_METHODS:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    if len(body_bytes) > self.MAX_BODY_LENGTH:
                        body = f"[Body too large: {len(body_bytes)} bytes]"
                    else:
                        try:
                            body = json.loads(body_bytes)
                        except:
                            body = body_bytes.decode('utf-8', errors='ignore')
                
            except Exception as e:
                logger.debug(f"Could not read request body: {e}")
        
        return {
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "body": body,
            "user_agent": request.headers.get("user-agent"),
            "client": f"{request.client.host}:{request.client.port}" if request.client else "unknown",
        }


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


class PerformanceMonitorMiddleware(BaseHTTPMiddleware):
    _metrics = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        endpoint = f"{request.method} {request.url.path}"
        if endpoint not in self._metrics:
            self._metrics[endpoint] = {
                "count": 0,
                "total_time": 0,
                "min_time": float('inf'),
                "max_time": 0,
                "errors": 0,
            }
        
        metrics = self._metrics[endpoint]
        metrics["count"] += 1
        metrics["total_time"] += process_time
        metrics["min_time"] = min(metrics["min_time"], process_time)
        metrics["max_time"] = max(metrics["max_time"], process_time)
        
        if response.status_code >= 400:
            metrics["errors"] += 1
        
        if process_time > 1.0:
            logger.warning(
                f"SLOW RESPONSE | {endpoint} | Time: {process_time:.3f}s | Status: {response.status_code}"
            )
        
        return response
    
    @classmethod
    def get_metrics(cls) -> dict:
        """Lấy performance metrics"""
        metrics_summary = {}
        for endpoint, metrics in cls._metrics.items():
            avg_time = metrics["total_time"] / metrics["count"] if metrics["count"] > 0 else 0
            metrics_summary[endpoint] = {
                "requests": metrics["count"],
                "avg_time_ms": round(avg_time * 1000, 2),
                "min_time_ms": round(metrics["min_time"] * 1000, 2),
                "max_time_ms": round(metrics["max_time"] * 1000, 2),
                "errors": metrics["errors"],
            }
        return metrics_summary


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        import uuid
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response
