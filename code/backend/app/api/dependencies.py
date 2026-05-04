"""FastAPI dependency injection helpers."""

from typing import Annotated, Any

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.infrastructure.cache import cache_get
from app.infrastructure.database import get_db

_bearer = HTTPBearer()

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict[str, Any]:
    payload = decode_access_token(credentials.credentials)
    jti = payload.get("jti", "")
    if cache_get(f"blocklist:{jti}"):
        raise UnauthorizedError("Token has been revoked")
    return {
        "sub": payload["sub"],
        "role": payload["role"],
        "org_id": payload["org_id"],
        "jti": jti,
    }


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]


def require_admin(user: CurrentUser) -> dict[str, Any]:
    if user.get("role") != "ADMIN":
        raise ForbiddenError("Admin access required")
    return user


def get_org_id(
    user: CurrentUser,
    x_organization_id: str = Header(...),
) -> str:
    if x_organization_id != user.get("org_id"):
        raise ForbiddenError("Organization ID mismatch")
    return x_organization_id


OrgId = Annotated[str, Depends(get_org_id)]
