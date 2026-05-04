"""Organization endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.config import settings
from app.domain.schemas.common import PaginatedResponse
from app.domain.schemas.organization import OrgCreate, OrgResponse, OrgSummary, OrgUpdate
from app.infrastructure.database import get_db
from app.service.org_service import OrgService

router = APIRouter(
    prefix=f"{settings.api_prefix}/organizations", tags=["organizations"],
    dependencies=[Depends(require_admin)],
)


def _org_service(db: Session = Depends(get_db)) -> OrgService:
    return OrgService(db)


@router.get("", response_model=PaginatedResponse[OrgSummary])
def list_orgs(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    svc: OrgService = Depends(_org_service),
) -> PaginatedResponse[OrgSummary]:
    return svc.list_orgs(page, page_size)


@router.post("", response_model=OrgResponse, status_code=201)
def create_org(
    body: OrgCreate, user: dict = Depends(require_admin),
    svc: OrgService = Depends(_org_service),
) -> OrgResponse:
    return svc.create_org(body.model_dump(), user["sub"])


@router.put("/{org_id}", response_model=OrgResponse)
def update_org(
    org_id: UUID, body: OrgUpdate, user: dict = Depends(require_admin),
    svc: OrgService = Depends(_org_service),
) -> OrgResponse:
    return svc.update_org(org_id, body.model_dump(exclude_none=True) | {"version_num": body.version_num}, user["sub"])


@router.delete("/{org_id}", status_code=204)
def delete_org(org_id: UUID, svc: OrgService = Depends(_org_service)) -> None:
    svc.delete_org(org_id)


@router.post("/{org_id}/users", status_code=201)
def assign_user(
    org_id: UUID, body: dict, user: dict = Depends(require_admin),
    svc: OrgService = Depends(_org_service),
) -> dict:
    return svc.assign_user(org_id, UUID(body["user_id"]), user["sub"])


@router.delete("/{org_id}/users/{user_id}", status_code=204)
def remove_user(org_id: UUID, user_id: UUID, svc: OrgService = Depends(_org_service)) -> None:
    svc.remove_user(org_id, user_id)
