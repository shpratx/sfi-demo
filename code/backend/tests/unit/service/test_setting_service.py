"""Unit tests for SettingService."""

import uuid

import pytest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError
from app.domain.schemas.setting import UpdateSettingRequest
from app.service.setting_service import SettingService
from tests.factories.setting_factory import SettingFactory


@pytest.fixture()
def org_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture()
def svc(db_session: Session, mock_redis: MagicMock) -> SettingService:
    return SettingService(db_session, mock_redis)


def _seed(db: Session, org_id: uuid.UUID, count: int = 3, **overrides):
    settings = []
    for i in range(count):
        s = SettingFactory.build(
            org_id=org_id,
            setting_name=f"setting_{i}",
            display_order=count - i,  # reverse so ordering is testable
            **overrides,
        )
        db.add(s)
        settings.append(s)
    db.commit()
    return settings


def test_get_settings_returns_ordered_list(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    _seed(db_session, org_id, count=3)
    result = svc.get_settings(org_id)
    assert len(result) == 3
    assert result[0].display_order <= result[1].display_order <= result[2].display_order


def test_update_setting_when_locked_raises_422(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    settings = _seed(db_session, org_id, count=1, toggle_locked=True, toggle_state=False)
    req = UpdateSettingRequest(toggle_state=True, version_num=1)
    with pytest.raises(BusinessRuleError):
        svc.update_setting(settings[0].id, org_id, req, "user-1")


def test_update_setting_version_conflict_raises_409(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    settings = _seed(db_session, org_id, count=1)
    req = UpdateSettingRequest(toggle_state=True, version_num=999)
    with pytest.raises(ConflictError):
        svc.update_setting(settings[0].id, org_id, req, "user-1")


def test_update_setting_invalid_alphanumeric_raises_422(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    settings = _seed(db_session, org_id, count=1, input_type="ALPHANUMERIC")
    req = UpdateSettingRequest(input_value="<script>alert(1)</script>", version_num=1)
    with pytest.raises(BusinessRuleError):
        svc.update_setting(settings[0].id, org_id, req, "user-1")


def test_update_setting_numeric_only_for_hours(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    settings = _seed(db_session, org_id, count=1, input_type="NUMERIC")
    req = UpdateSettingRequest(input_value="abc", version_num=1)
    with pytest.raises(BusinessRuleError):
        svc.update_setting(settings[0].id, org_id, req, "user-1")


def test_update_setting_success_increments_version(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    settings = _seed(db_session, org_id, count=1)
    req = UpdateSettingRequest(toggle_state=True, version_num=1)
    result = svc.update_setting(settings[0].id, org_id, req, "user-1")
    assert result.version_num == 2


def test_get_mobile_settings_excludes_toggled_off(svc: SettingService, db_session: Session, org_id: uuid.UUID):
    _seed(db_session, org_id, count=2, toggle_state=True)
    _seed(db_session, org_id, count=1, toggle_state=False)
    result = svc.get_mobile_settings(org_id)
    assert len(result) == 2
