from datetime import datetime
from uuid import UUID

from app.domain.schemas.common import CamelModel


class UpdateSettingRequest(CamelModel):
    toggle_state: bool | None = None
    input_value: str | None = None
    version_num: int


class SettingResponse(CamelModel):
    model_config = {"from_attributes": True}
    id: UUID
    setting_name: str
    toggle_state: bool
    toggle_locked: bool
    input_value: str | None = None
    input_type: str | None = None
    display_order: int
    version_num: int
    updated_at: datetime
    updated_by: str | None = None


class UpdateSettingResponse(CamelModel):
    model_config = {"from_attributes": True}
    id: UUID
    version_num: int
    updated_at: datetime


class MobileSettingItem(CamelModel):
    model_config = {"from_attributes": True}
    setting_name: str
    input_value: str | None = None


class MobileSettingsResponse(CamelModel):
    settings: list[MobileSettingItem]
