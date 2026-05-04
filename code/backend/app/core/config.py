"""Application configuration via Pydantic BaseSettings."""

from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "driver-checkin-service"
    api_prefix: str = "/api/v1"
    debug: bool = False

    # Oracle DB
    db_user: str = "app_user"
    db_password: str = "changeme"
    db_host: str = "localhost"
    db_port: int = 1521
    db_service: str = "FREEPDB1"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT RS256
    jwt_private_key: str = ""
    jwt_public_key: str = ""
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_days: int = 7

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def db_url(self) -> str:
        return (
            f"oracle+oracledb://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/?service_name={self.db_service}"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
