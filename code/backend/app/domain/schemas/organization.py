from datetime import datetime
from uuid import UUID

from app.domain.schemas.common import CamelModel


class OrgCreate(CamelModel):
    name: str
    address: str | None = None
    phone: str | None = None


class OrgUpdate(CamelModel):
    name: str | None = None
    address: str | None = None
    phone: str | None = None
    version_num: int


class OrgResponse(CamelModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    address: str | None = None
    phone: str | None = None
    is_active: bool
    version_num: int
    created_at: datetime
    updated_at: datetime


class OrgSummary(CamelModel):
    model_config = {"from_attributes": True}
    id: UUID
    name: str
    is_active: bool
    user_count: int = 0
