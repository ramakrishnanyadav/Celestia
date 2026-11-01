import base64
import hashlib
import hmac
import os
import re
import secrets
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import RefreshToken, User

security = HTTPBearer(auto_error=False)

def get_argon2_hasher() -> PasswordHasher:
    """
    Returns an Argon2id hasher.
    In testing mode, uses lower cost parameters for fast test execution.
    In production, uses RFC 9106 recommended parameters (time=3, mem=64MB, parallelism=4).
    """
    if os.environ.get("TESTING") == "1":
        return PasswordHasher(time_cost=1, memory_cost=1024, parallelism=1, hash_len=16)
    return PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, hash_len=32)

LEGACY_PBKDF2_SALT = "celestia_salt_indian_wedding_2026"

def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return get_argon2_hasher().hash(password)

# Pre-computed dummy Argon2id hash for constant-time failed login timing defense
DUMMY_ARGON2_HASH = hash_password("dummy_password_for_constant_time_timing_defense")

# In-memory cache for HaveIBeenPwned API lookups
_HIBP_CACHE: dict[str, bool] = {}

def check_pwned_password(password: str) -> bool:
    """
    Checks if password has appeared in public breaches via HaveIBeenPwned k-anonymity API.
    Uses SHA-1 hash prefix (5 hex chars) to protect privacy.
    Returns True if pwned, False if clean.
    Gracefully falls back to False on network error, offline mode, or timeout.
    """
    if os.environ.get("TESTING") == "1":
        return password == "PwnedPassword123!"

    # HaveIBeenPwned API uses SHA-1 k-anonymity prefix matching (non-cryptographic use case)
    sha1_pwd = hashlib.sha1(password.encode("utf-8"), usedforsecurity=False).hexdigest().upper()  # nosec B324
    prefix = sha1_pwd[:5]
    suffix = sha1_pwd[5:]

    if sha1_pwd in _HIBP_CACHE:
        return _HIBP_CACHE[sha1_pwd]

    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "CELESTIA-Security-Validator/2.0"}
        )
        with urllib.request.urlopen(req, timeout=2.0) as resp:  # nosec B310
            body = resp.read().decode("utf-8")
            for line in body.splitlines():
                parts = line.split(":")
                if len(parts) == 2 and parts[0].strip().upper() == suffix:
                    _HIBP_CACHE[sha1_pwd] = True
                    return True
            _HIBP_CACHE[sha1_pwd] = False
            return False
    except Exception:
        # Graceful fallback: network outage or timeout should not prevent registration
        return False

def validate_password_strength(password: str) -> None:
    """
    Enforces NIST / enterprise password requirements:
    - Minimum 10 characters
    - Must contain uppercase, lowercase, digit, and special character
    - Must not be a known compromised password (HIBP check)
    """
    if len(password) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must be at least 10 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must contain at least one lowercase letter."
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must contain at least one digit."
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+/\\\[\]]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must contain at least one special character."
        )
    if check_pwned_password(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="This password has appeared in public data breaches. Please choose a unique, stronger password."
        )

def verify_password_and_needs_rehash(plain_password: str, hashed_password: str) -> tuple[bool, bool]:
    """
    Verifies a password against either Argon2id or legacy PBKDF2.
    Returns (is_valid, needs_rehash).
    """
    if hashed_password.startswith("$argon2"):
        try:
            hasher = get_argon2_hasher()
            hasher.verify(hashed_password, plain_password)
            needs_rehash = hasher.check_needs_rehash(hashed_password)
            return True, needs_rehash
        except (VerifyMismatchError, InvalidHashError):
            return False, False

    # Fallback check for legacy PBKDF2 hashes
    try:
        raw_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            LEGACY_PBKDF2_SALT.encode('utf-8'),
            100000
        )
        computed_legacy = base64.b64encode(raw_hash).decode('utf-8')
        if hmac.compare_digest(computed_legacy, hashed_password):
            return True, True
    except Exception:
        pass

    return False, False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Convenience wrapper for verify_password_and_needs_rehash."""
    valid, _ = verify_password_and_needs_rehash(plain_password, hashed_password)
    return valid

def create_access_token(data: dict, expires_delta: int | None = None) -> str:
    """Creates a signed PyJWT token with HS256 algorithm, mandatory exp claim, and unique jti."""
    payload = data.copy()
    now = int(time.time())
    expire_seconds = expires_delta if expires_delta is not None else (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload["iat"] = now
    payload["exp"] = now + expire_seconds
    payload["jti"] = secrets.token_hex(16)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict | None:
    """Decodes and validates a PyJWT token, strictly requiring HS256 and exp."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]}
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None

def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of refresh token for safe database persistence."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def create_refresh_token(db: Session, user_id: str) -> str:
    """
    Generates a cryptographically secure refresh token, stores its hash,
    and sets expiration according to REFRESH_TOKEN_EXPIRE_DAYS.
    """
    raw_token = secrets.token_urlsafe(48)
    token_h = hash_token(raw_token)
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    rt = RefreshToken(
        user_id=user_id,
        token_hash=token_h,
        expires_at=expires_at,
        revoked=False
    )
    db.add(rt)
    db.commit()
    return raw_token

def rotate_refresh_token(db: Session, raw_token: str) -> tuple[User, str, str]:
    """
    Validates the refresh token, revokes it, and issues a new pair (access token + refresh token).
    If a revoked token is replayed, all refresh tokens for that user are revoked (breach detection).
    """
    token_h = hash_token(raw_token)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_h).first()

    if not rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if rt.revoked:
        # Breach detection: Revoke all tokens for this user immediately
        db.query(RefreshToken).filter(RefreshToken.user_id == rt.user_id).update({"revoked": True})
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Revoked refresh token re-used. Session invalidated for security.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    rt_expires = rt.expires_at
    if rt_expires.tzinfo is None:
        rt_expires = rt_expires.replace(tzinfo=UTC)

    if rt_expires < datetime.now(UTC):
        rt.revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == rt.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Rotate: revoke old, create new
    new_raw_token = secrets.token_urlsafe(48)
    new_token_h = hash_token(new_raw_token)

    rt.revoked = True
    rt.replaced_by = new_token_h

    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=new_token_h,
        expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        revoked=False
    )
    db.add(new_rt)
    db.commit()

    new_access_token = create_access_token({"sub": user.id, "email": user.email})
    return user, new_access_token, new_raw_token

def revoke_refresh_token(db: Session, raw_token: str) -> bool:
    """Revokes a refresh token on logout."""
    token_h = hash_token(raw_token)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_h).first()
    if rt:
        rt.revoked = True
        db.commit()
        return True
    return False

def revoke_all_user_tokens(db: Session, user_id: str) -> int:
    """Revokes all active refresh tokens for the given user (e.g. on logout-all or password change)."""
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked.is_(False)
    ).update({"revoked": True})
    db.commit()
    return count

def get_user_active_sessions(db: Session, user_id: str, current_raw_token: str | None = None) -> list[dict]:
    """Returns active (non-revoked, unexpired) sessions for the user."""
    now = datetime.now(UTC)
    tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked.is_(False),
        RefreshToken.expires_at > now
    ).order_by(RefreshToken.created_at.desc()).all()

    current_hash = hash_token(current_raw_token) if current_raw_token else None
    sessions = []
    for t in tokens:
        sessions.append({
            "id": t.id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "expires_at": t.expires_at.isoformat() if t.expires_at else None,
            "is_current": (t.token_hash == current_hash)
        })
    return sessions

def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str | None = None,
    csrf_token: str | None = None
):
    """
    Sets secure HttpOnly, SameSite cookies for tokens and readable CSRF token.
    In production, Secure=True is enforced.
    """
    is_prod = (settings.ENV == "production")

    # Access token in HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            path="/api/auth"
        )

    if csrf_token:
        # CSRF token is deliberately NOT HttpOnly so frontend JS can read and send in header
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=is_prod,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            path="/"
        )

def clear_auth_cookies(response: Response):
    """Clears all authentication cookies."""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/api/auth")
    response.delete_cookie("csrf_token", path="/")

def get_or_create_demo_user(db: Session) -> User:
    """
    Returns or seeds the primary shared demo user 'demo@celestia.ai'.
    Protected with random per-boot unusable password to prevent password login.
    """
    demo_email = "demo@celestia.ai"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            name="Anjali & Rahul",
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="planner",
            is_demo=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def create_ephemeral_demo_user(db: Session) -> User:
    """
    Creates a fresh temporary demo account with 24-hour expiry.
    """
    rand_id = secrets.token_hex(4)
    email = f"demo_{rand_id}@celestia.demo"
    user = User(
        email=email,
        name=f"Demo Guest ({rand_id.upper()})",
        password_hash=hash_password(secrets.token_urlsafe(16)),
        role="planner",
        is_demo=True,
        expires_at=datetime.now(UTC) + timedelta(hours=24)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts authenticated user from either:
    1. HTTP Authorization Bearer header, OR
    2. HttpOnly 'access_token' cookie with CSRF verification on mutating requests.
    Strictly returns HTTP 401 Unauthorized if missing, expired, or invalid.
    """
    token: str | None = None
    from_cookie = False

    if credentials and credentials.credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies["access_token"]
        from_cookie = True

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # CSRF Check on state-changing requests when authenticated via cookie
    if from_cookie and request.method in ("POST", "PUT", "PATCH", "DELETE"):
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("X-CSRF-Token")
        if not csrf_cookie or not csrf_header or not hmac.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed."
            )

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Check if demo account has expired
    if user.is_demo and user.expires_at:
        u_exp = user.expires_at
        if u_exp.tzinfo is None:
            u_exp = u_exp.replace(tzinfo=UTC)
        if u_exp < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Temporary demo account has expired. Please launch a fresh demo session.",
                headers={"WWW-Authenticate": "Bearer"}
            )

    return user
