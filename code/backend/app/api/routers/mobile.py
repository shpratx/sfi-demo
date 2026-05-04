"""Mobile settings endpoint with separate auth."""

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import ALGORITHM
from app.domain.schemas.setting import MobileSettingsResponse
from app.infrastructure.cache import _redis
from app.infrastructure.database import get_db
from app.service.setting_service import SettingService

router = APIRouter(prefix=f"{settings.api_prefix}/driver-checkin/settings", tags=["mobile"])

_bearer = HTTPBearer()


def get_mobile_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_public_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise UnauthorizedError(f"Invalid token: {exc}") from exc
    if payload.get("aud") != "mobile":
        raise ForbiddenError("Mobile access required")
    if not payload.get("org_id"):
        raise ForbiddenError("Missing org_id claim in token")
    return payload


@router.get("/mobile", response_model=MobileSettingsResponse)
def get_mobile_settings(
    user: dict = Depends(get_mobile_user),
    db: Session = Depends(get_db),
) -> MobileSettingsResponse:
    svc = SettingService(db, _redis)
    items = svc.get_mobile_settings(UUID(user["org_id"]))
    return MobileSettingsResponse(settings=items)
