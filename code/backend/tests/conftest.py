"""Shared test fixtures."""

import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from jose import jwt
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.domain.models import Base
from app.infrastructure.database import get_db

# ---------------------------------------------------------------------------
# RSA key pair for tests (small 1024-bit, test-only)
# ---------------------------------------------------------------------------
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

_rsa_key = rsa.generate_private_key(public_exponent=65537, key_size=1024)
TEST_PRIVATE_KEY = _rsa_key.private_bytes(
    serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8,
    serialization.NoEncryption(),
).decode()
TEST_PUBLIC_KEY = _rsa_key.public_key().public_bytes(
    serialization.Encoding.PEM,
    serialization.PublicFormat.SubjectPublicKeyInfo,
).decode()

# Patch settings before any app import that reads them at module level
import app.core.config as _cfg

_cfg.settings.jwt_private_key = TEST_PRIVATE_KEY
_cfg.settings.jwt_public_key = TEST_PUBLIC_KEY


# ---------------------------------------------------------------------------
# SQLite in-memory engine — handle schema-qualified tables
# ---------------------------------------------------------------------------
_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(_test_engine, "connect")
def _set_sqlite_pragma(dbapi_conn: Any, _rec: Any) -> None:
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=OFF")
    cursor.close()


TestSession = sessionmaker(bind=_test_engine, autocommit=False, autoflush=False)

# Strip schemas from all tables once at import time so SQLite works
for _tbl in Base.metadata.sorted_tables:
    _tbl.schema = None


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=_test_engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=_test_engine)


@pytest.fixture()
def mock_redis() -> MagicMock:
    r = MagicMock()
    r.get.return_value = None
    r.set.return_value = True
    r.delete.return_value = True
    r.scan.return_value = (0, [])
    r.ping.return_value = True
    return r


@pytest.fixture()
def client(db_session: Session, mock_redis: MagicMock) -> Generator[TestClient, None, None]:
    from main import create_app

    app = create_app()

    def _override_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_db

    # Patch the module-level _redis used by cache helpers and routers
    with patch("app.infrastructure.cache._redis", mock_redis), \
         patch("app.api.routers.settings._redis", mock_redis), \
         patch("app.api.routers.health._redis", mock_redis), \
         patch("app.api.routers.health.SessionLocal", TestSession):
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c

    app.dependency_overrides.clear()


def _make_token(role: str, org_id: str) -> str:
    payload = {
        "sub": str(uuid.uuid4()),
        "role": role,
        "org_id": org_id,
        "jti": str(uuid.uuid4()),
        "exp": datetime.now(UTC) + timedelta(hours=1),
        "type": "access",
    }
    return jwt.encode(payload, TEST_PRIVATE_KEY, algorithm="RS256")


@pytest.fixture()
def auth_headers() -> dict[str, str]:
    token = _make_token("ADMIN", "test-org-1")
    return {
        "Authorization": f"Bearer {token}",
        "X-Organization-Id": "test-org-1",
    }


@pytest.fixture()
def standard_headers() -> dict[str, str]:
    token = _make_token("STANDARD", "test-org-1")
    return {
        "Authorization": f"Bearer {token}",
        "X-Organization-Id": "test-org-1",
    }
