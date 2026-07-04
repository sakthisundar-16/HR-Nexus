"""
HR Nexus — Security Utilities

Provides:
- Password hashing and verification (bcrypt)
- JWT access token creation and decoding
- JWT refresh token creation and decoding
- Token payload types
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.core.exceptions import UnauthorizedException

settings = get_settings()

# bcrypt context — supports algorithm rotation (e.g., migrating from sha256)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================
# Password Utilities
# ============================================================


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================
# JWT Token Utilities
# ============================================================


def create_access_token(
    subject: str,
    role: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: User ID (stored as 'sub' claim)
        role: User role for RBAC (stored in token to avoid DB lookup per request)
        extra_claims: Additional claims to include
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": expire,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """
    Create a JWT refresh token (longer-lived, used to obtain new access tokens).
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.REFRESH_SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate an access token.

    Returns the token payload dict.
    Raises UnauthorizedException if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type")
        if payload.get("sub") is None:
            raise UnauthorizedException("Token missing subject claim")
        return payload
    except JWTError as e:
        raise UnauthorizedException(f"Invalid or expired token: {e}")


def decode_refresh_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a refresh token.

    Returns the token payload dict.
    Raises UnauthorizedException if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.REFRESH_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")
        if payload.get("sub") is None:
            raise UnauthorizedException("Token missing subject claim")
        return payload
    except JWTError as e:
        raise UnauthorizedException(f"Invalid or expired refresh token: {e}")
