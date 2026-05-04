"""ASGI middleware for correlation IDs and exception handling."""

import time
import uuid
from typing import Any

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from fastapi.exceptions import RequestValidationError

from app.core.exceptions import AppException

logger: structlog.stdlib.BoundLogger = structlog.get_logger()


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        correlation_id = request.headers.get("X-Correlation-Id", str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)

        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        response.headers["X-Correlation-Id"] = correlation_id
        logger.info(
            "request_completed",
            method=request.method,
            path=str(request.url.path),
            status=response.status_code,
            elapsed_ms=elapsed_ms,
        )
        return response


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except RequestValidationError as exc:
            errors = [
                {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
                for e in exc.errors()
            ]
            return JSONResponse(
                status_code=400,
                content={
                    "type": "VALIDATION_ERROR",
                    "title": "Bad Request",
                    "status": 400,
                    "detail": "Request validation failed",
                    "errors": errors,
                },
                media_type="application/problem+json",
            )
        except AppException as exc:
            return self._problem_response(exc.status_code, exc.error_type, exc.title, exc.detail)
        except Exception:
            ctx: dict[str, Any] = structlog.contextvars.get_contextvars()
            cid = ctx.get("correlation_id", "unknown")
            logger.exception("unhandled_exception")
            return self._problem_response(
                500,
                "INTERNAL_ERROR",
                "Internal Server Error",
                f"An unexpected error occurred. correlation_id={cid}",
            )

    @staticmethod
    def _problem_response(
        status_code: int, error_type: str, title: str, detail: str
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content={
                "type": error_type,
                "title": title,
                "status": status_code,
                "detail": detail,
            },
            media_type="application/problem+json",
        )
