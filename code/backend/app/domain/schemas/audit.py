from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.domain.schemas.common import CamelModel


class AuditLogResponse(CamelModel):
    model_config = {"from_attributes": True}
    id: UUID
    user_id: UUID
    org_id: UUID
    setting_id: UUID | None = None
    action: str
    old_value: str | None = None
    new_value: str | None = None
    timestamp: datetime
    correlation_id: str | None = None


class AuditLogQuery(CamelModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    setting_id: UUID | None = None
    from_date: datetime | None = None
    to_date: datetime | None = None
