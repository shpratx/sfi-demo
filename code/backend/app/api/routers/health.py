"""Health check endpoints."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.infrastructure.cache import _redis
from app.infrastructure.database import SessionLocal

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
def readiness() -> dict[str, str]:
    errors: list[str] = []

    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1 FROM DUAL"))
    except Exception:
        errors.append("database")

    try:
        _redis.ping()
    except Exception:
        errors.append("redis")

    if errors:
        return JSONResponse(status_code=503, content={"status": "degraded", "failing": ", ".join(errors)})
    return {"status": "ok"}
