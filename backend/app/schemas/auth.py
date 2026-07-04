"""
HR Nexus — Auth Schemas

Pydantic models for authentication endpoints: login, tokens, password change.
"""

import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.validators import validate_password_strength


class LoginRequest(BaseModel):
    """Login credentials request."""

    email: EmailStr = Field(description="User email address")
    password: str = Field(min_length=1, description="Plaintext password")


class TokenResponse(BaseModel):
    """JWT tokens returned upon successful authentication."""

    access_token: str = Field(description="Short-lived JWT access token")
    refresh_token: str = Field(description="Longer-lived JWT refresh token")
    token_type: str = Field(default="bearer", description="Token scheme")
    expires_in: int = Field(description="Access token expiration time in seconds")


class RefreshTokenRequest(BaseModel):
    """Request to exchange a refresh token for a new access token."""

    refresh_token: str = Field(description="Valid JWT refresh token")


class ChangePasswordRequest(BaseModel):
    """Request to change user password."""

    current_password: str = Field(description="Current plaintext password")
    new_password: str = Field(min_length=8, description="New password meeting complexity rules")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserProfileResponse(BaseModel):
    """Basic user info embedded in auth responses."""

    id: uuid.UUID
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
