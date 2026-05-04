"""Authentication service."""

import json
import uuid
from datetime import UTC, datetime, timedelta

import structlog
from redis import Redis
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
)
from app.domain.models.user import User
from app.domain.models.user_organization import UserOrganization
from app.domain.schemas.auth import LoginResponse, TokenUser

logger: structlog.stdlib.BoundLogger = structlog.get_logger()

_FAILED_LIMIT = 5
_LOCK_MINUTES = 15
_SESSION_TTL = 1800  # 30 min
_REFRESH_TTL = 604800  # 7 days


class LoginResult:
    """Internal result carrying LoginResponse + refresh_token for cookie."""

    def __init__(self, response: LoginResponse, refresh_token: str) -> None:
        self.response = response
        self.refresh_token = refresh_token


class AuthService:
    def __init__(self, db: Session, redis: Redis) -> None:  # type: ignore[type-arg]
        self.db = db
        self.redis = redis

    def login(self, email: str, password: str) -> LoginResult:
        user = self.db.query(User).filter(User.email == email, User.is_deleted.is_(False)).first()
        if not user:
            raise UnauthorizedError("Invalid credentials")

        now = datetime.now(UTC)

        # Check lock
        if user.locked_until and user.locked_until.replace(tzinfo=None) > now.replace(tzinfo=None):
            raise UnauthorizedError("Account locked. Try again later.")

        # Clear expired lock
        if user.locked_until and user.locked_until.replace(tzinfo=None) <= now.replace(tzinfo=None):
            user.locked_until = None

        if not verify_password(password, user.password_hash):
            user.failed_login_count = (user.failed_login_count or 0) + 1
            if user.failed_login_count >= _FAILED_LIMIT:
                user.locked_until = now + timedelta(minutes=_LOCK_MINUTES)
                user.failed_login_count = 0
            self.db.commit()
            raise UnauthorizedError("Invalid credentials")

        # Success — reset counters
        user.failed_login_count = 0
        user.locked_until = None
        self.db.commit()

        # Resolve org_id from first user_organization
        user_org = (
            self.db.query(UserOrganization)
            .filter(UserOrganization.user_id == user.id, UserOrganization.is_deleted.is_(False))
            .first()
        )
        org_id = str(user_org.org_id) if user_org else ""

        jti = str(uuid.uuid4())
        access_token = create_access_token(str(user.id), user.role, org_id, jti)
        refresh_token = create_refresh_token()

        # Store session and refresh in Redis
        self.redis.set(f"session:{jti}", str(user.id), ex=_SESSION_TTL)
        self.redis.set(
            f"refresh:{refresh_token}",
            json.dumps({"user_id": str(user.id), "org_id": org_id, "jti": jti}),
            ex=_REFRESH_TTL,
        )

        return LoginResult(
            response=LoginResponse(
                access_token=access_token,
                user=TokenUser(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    role=user.role,
                    org_id=uuid.UUID(org_id) if org_id else None,
                ),
            ),
            refresh_token=refresh_token,
        )

    def logout(self, jti: str, refresh_token: str | None) -> None:
        self.redis.set(f"blocklist:{jti}", "1", ex=_SESSION_TTL)
        if refresh_token:
            self.redis.delete(f"refresh:{refresh_token}")

    def refresh(self, refresh_token: str) -> LoginResult:
        stored = self.redis.get(f"refresh:{refresh_token}")
        if not stored:
            raise UnauthorizedError("Invalid refresh token")

        data = json.loads(stored)
        user_id = data["user_id"]

        user = self.db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
        if not user:
            raise UnauthorizedError("User not found")

        # Delete old refresh token
        self.redis.delete(f"refresh:{refresh_token}")

        # Resolve org_id
        user_org = (
            self.db.query(UserOrganization)
            .filter(UserOrganization.user_id == user.id, UserOrganization.is_deleted.is_(False))
            .first()
        )
        org_id = str(user_org.org_id) if user_org else ""

        # Issue new tokens
        new_jti = str(uuid.uuid4())
        new_access = create_access_token(str(user.id), user.role, org_id, new_jti)
        new_refresh = create_refresh_token()

        self.redis.set(f"session:{new_jti}", str(user.id), ex=_SESSION_TTL)
        self.redis.set(
            f"refresh:{new_refresh}",
            json.dumps({"user_id": str(user.id), "org_id": org_id, "jti": new_jti}),
            ex=_REFRESH_TTL,
        )

        return LoginResult(
            response=LoginResponse(
                access_token=new_access,
                user=TokenUser(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    role=user.role,
                    org_id=uuid.UUID(org_id) if org_id else None,
                ),
            ),
            refresh_token=new_refresh,
        )
