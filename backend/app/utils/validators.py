"""
HR Nexus — Input Validators

Custom validation functions for business rules.
Used in Pydantic schemas and services.
"""

import re


def validate_password_strength(password: str) -> str:
    """
    Validate password meets enterprise security requirements:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character

    Returns the password if valid, raises ValueError otherwise.
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/~`]", password):
        raise ValueError("Password must contain at least one special character")
    return password


def validate_email_format(email: str) -> str:
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise ValueError("Invalid email format")
    return email.lower().strip()


def validate_phone_number(phone: str) -> str:
    """Validate phone number format (flexible — allows international formats)."""
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    if not re.match(r"^\+?\d{7,15}$", cleaned):
        raise ValueError("Invalid phone number format")
    return cleaned


def sanitize_string(value: str) -> str:
    """Strip and sanitize a string input."""
    return value.strip()
