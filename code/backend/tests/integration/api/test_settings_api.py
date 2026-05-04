"""Integration tests for settings API."""

import uuid

import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from tests.factories.setting_factory import SettingFactory

_ORG_ID = "test-org-1"
_PREFIX = "/api/v1/driver-checkin/settings"


def _seed(db: Session, count: int = 2, **overrides):
    settings = []
    for i in range(count):
        s = SettingFactory.build(
            org_id=_ORG_ID,
            setting_name=f"setting_{i}",
            display_order=i + 1,
            **overrides,
        )
        db.add(s)
        settings.append(s)
    db.commit()
    return settings


def test_get_settings_returns_200_with_list(client: TestClient, db_session: Session, auth_headers: dict):
    _seed(db_session)
    resp = client.get(_PREFIX, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_update_setting_returns_200_with_new_version(client: TestClient, db_session: Session, auth_headers: dict):
    settings = _seed(db_session)
    setting_id = str(settings[0].id)
    resp = client.put(
        f"{_PREFIX}/{setting_id}",
        json={"toggleState": True, "versionNum": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["versionNum"] == 2


def test_update_locked_setting_returns_422(client: TestClient, db_session: Session, auth_headers: dict):
    settings = _seed(db_session, count=1, toggle_locked=True, toggle_state=False)
    setting_id = str(settings[0].id)
    resp = client.put(
        f"{_PREFIX}/{setting_id}",
        json={"toggleState": True, "versionNum": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_update_setting_without_auth_returns_401_or_403(client: TestClient, db_session: Session):
    settings = _seed(db_session)
    setting_id = str(settings[0].id)
    resp = client.put(
        f"{_PREFIX}/{setting_id}",
        json={"toggleState": True, "versionNum": 1},
    )
    assert resp.status_code in (401, 403)


def test_version_conflict_returns_409(client: TestClient, db_session: Session, auth_headers: dict):
    settings = _seed(db_session, count=1)
    setting_id = str(settings[0].id)
    resp = client.put(
        f"{_PREFIX}/{setting_id}",
        json={"toggleState": True, "versionNum": 999},
        headers=auth_headers,
    )
    assert resp.status_code == 409
