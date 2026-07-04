"""
HR Nexus — Application Configuration

Centralized settings management using pydantic-settings.
All configuration is loaded from environment variables / .env file.
Business rules are configurable, not hardcoded.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Application ---
    APP_NAME: str = "HR Nexus"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./hr_nexus.db"

    @field_validator("DATABASE_URL")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # --- Security ---
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # --- JWT ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # --- Business Rules (configurable, not hardcoded) ---
    WORK_START_HOUR: int = 9
    WORK_START_MINUTE: int = 30
    FULL_DAY_HOURS: int = 8
    HALF_DAY_HOURS: int = 4

    # Leave balances per year
    ANNUAL_LEAVE_BALANCE: int = 12
    SICK_LEAVE_BALANCE: int = 6
    PERSONAL_LEAVE_BALANCE: int = 3

    # Payroll
    TAX_RATE: float = 0.10

    # Rate Limiting
    LOGIN_RATE_LIMIT_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_MINUTES: int = 15

    # Admin seed
    ADMIN_EMAIL: str = "admin@hrnexus.com"
    ADMIN_PASSWORD: str = "Admin@123456"


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    Called once per process lifetime — avoids re-reading .env on every request.
    """
    return Settings()
