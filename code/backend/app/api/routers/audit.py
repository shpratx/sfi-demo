"""Audit log endpoints."""

import math
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.config import settings
from app.domain.models.audit_log import AuditLog
from app.domain.schemas.audit import AuditLogResponse
from app.domain.schemas.common import PaginatedResponse, PaginationMeta
from app.infrastructure.database import get_db

router = APIRouter(
    prefix=f"{settings.api_prefix}/driver-checkin/audit", tags=["audit"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    x_organization_id: str = Header(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    setting_id: UUID | None = Query(None),
    from_date: datetime | None = Query(None),
    to_date: datetime | None = Query(None),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AuditLogResponse]:
    org_id = UUID(x_organization_id)
    q = db.query(AuditLog).filter(AuditLog.org_id == org_id)
    if setting_id:
        q = q.filter(AuditLog.setting_id == setting_id)
    if from_date:
        q = q.filter(AuditLog.timestamp >= from_date)
    if to_date:
        q = q.filter(AuditLog.timestamp <= to_date)

    total = q.count()
    rows = q.order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(
        data=[AuditLogResponse.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page, page_size=page_size, total_count=total,
            total_pages=math.ceil(total / page_size) if page_size else 0,
        ),
    )
