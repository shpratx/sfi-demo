"""Auth endpoints."""

from fastapi import APIRouter, Cookie, Depends, Response
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import settings
from app.domain.schemas.auth import LoginRequest, LoginResponse, LogoutResponse, RefreshResponse
from app.infrastructure.cache import _redis
from app.infrastructure.database import get_db
from app.service.auth_service import AuthService

router = APIRouter(prefix=f"{settings.api_prefix}/auth", tags=["auth"])


def _auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db, _redis)


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, response: Response, svc: AuthService = Depends(_auth_service)) -> LoginResponse:
    result = svc.login(body.email, body.password)
    response.set_cookie(
        key="refresh_token", value=result.refresh_token,
        httponly=True, secure=True, samesite="strict", max_age=604800,
    )
    return result.response


@router.post("/logout", response_model=LogoutResponse)
def logout(
    response: Response, user: CurrentUser,
    svc: AuthService = Depends(_auth_service),
    refresh_token: str | None = Cookie(default=None),
) -> LogoutResponse:
    svc.logout(user["jti"], refresh_token)
    response.delete_cookie("refresh_token")
    return LogoutResponse()


@router.post("/refresh", response_model=RefreshResponse)
def refresh(
    response: Response, svc: AuthService = Depends(_auth_service),
    refresh_token: str | None = Cookie(default=None),
) -> RefreshResponse:
    if not refresh_token:
        from app.core.exceptions import UnauthorizedError
        raise UnauthorizedError("No refresh token")
    result = svc.refresh(refresh_token)
    response.set_cookie(
        key="refresh_token", value=result.refresh_token,
        httponly=True, secure=True, samesite="strict", max_age=604800,
    )
    return RefreshResponse(access_token=result.response.access_token)
