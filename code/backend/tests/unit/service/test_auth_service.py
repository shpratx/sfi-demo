"""Unit tests for AuthService."""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import hash_password
from app.service.auth_service import AuthService
from tests.factories.user_factory import UserFactory


@pytest.fixture()
def svc(db_session: Session, mock_redis: MagicMock) -> AuthService:
    return AuthService(db_session, mock_redis)


def _create_user(db: Session, password: str = "Test1234!", **overrides):
    user = UserFactory.build(password_hash=hash_password(password), **overrides)
    db.add(user)
    db.commit()
    return user


def test_login_success_returns_token(svc: AuthService, db_session: Session):
    _create_user(db_session, email="ok@test.com")
    resp = svc.login("ok@test.com", "Test1234!")
    assert resp.access_token
    assert resp.user.email == "ok@test.com"


def test_login_wrong_password_increments_failure(svc: AuthService, db_session: Session):
    user = _create_user(db_session, email="bad@test.com")
    with pytest.raises(UnauthorizedError):
        svc.login("bad@test.com", "wrong")
    db_session.refresh(user)
    assert user.failed_login_count == 1


def test_login_locked_account_returns_401(svc: AuthService, db_session: Session):
    _create_user(
        db_session,
        email="locked@test.com",
        locked_until=datetime.now(UTC) + timedelta(minutes=10),
    )
    with pytest.raises(UnauthorizedError, match="locked"):
        svc.login("locked@test.com", "Test1234!")
