"""Settings endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.api.dependencies import OrgId, require_admin
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.domain.schemas.setting import SettingResponse, UpdateSettingRequest, UpdateSettingResponse
from app.infrastructure.cache import _redis
from app.infrastructure.database import get_db
from app.service.setting_service import SettingService

router = APIRouter(
    prefix=f"{settings.api_prefix}/driver-checkin/settings", tags=["settings"],
    dependencies=[Depends(require_admin)],
)


def _setting_service(db: Session = Depends(get_db)) -> SettingService:
    return SettingService(db, _redis)


@router.get("", response_model=list[SettingResponse])
def list_settings(org_id: OrgId, svc: SettingService = Depends(_setting_service)) -> list[SettingResponse]:
    return svc.get_settings(UUID(org_id))


@router.get("/{setting_id}", response_model=SettingResponse)
def get_setting(
    setting_id: UUID, org_id: OrgId, svc: SettingService = Depends(_setting_service),
) -> SettingResponse:
    results = svc.get_settings(UUID(org_id))
    for s in results:
        if s.id == setting_id:
            return s
    raise NotFoundError("Setting not found")


@router.put("/{setting_id}", response_model=UpdateSettingResponse)
def update_setting(
    setting_id: UUID, body: UpdateSettingRequest, org_id: OrgId,
    user: dict = Depends(require_admin),
    svc: SettingService = Depends(_setting_service),
    x_correlation_id: str | None = Header(default=None),
) -> UpdateSettingResponse:
    return svc.update_setting(setting_id, UUID(org_id), body, user["sub"], x_correlation_id)
