from uuid import UUID

from pydantic import EmailStr, Field

from app.domain.schemas.common import CamelModel


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenUser(CamelModel):
    model_config = {"from_attributes": True}
    id: UUID
    email: str
    full_name: str
    role: str
    org_id: UUID | None = None


class LoginResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: TokenUser


class LogoutResponse(CamelModel):
    message: str = "Logged out successfully"


class RefreshResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
