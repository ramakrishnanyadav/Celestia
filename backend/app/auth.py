import time
import hashlib
import hmac
import base64
from typing import Optional, Tuple
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User

security = HTTPBearer(auto_error=False)

# Argon2id Hasher configured with RFC 9106 recommended parameters
_argon2_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32
)

LEGACY_PBKDF2_SALT = "celestia_salt_indian_wedding_2026"

def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return _argon2_hasher.hash(password)

def verify_password_and_needs_rehash(plain_password: str, hashed_password: str) -> Tuple[bool, bool]:
    """
    Verifies a password against either Argon2id or legacy PBKDF2.
    Returns (is_valid, needs_rehash).
    If a legacy PBKDF2 password succeeds, needs_rehash is True so caller can re-hash to Argon2id.
    """
    if hashed_password.startswith("$argon2"):
        try:
            _argon2_hasher.verify(hashed_password, plain_password)
            needs_rehash = _argon2_hasher.check_needs_rehash(hashed_password)
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
            return True, True # Valid, but needs upgrade to Argon2id
    except Exception:
        pass
        
    return False, False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Convenience wrapper for verify_password_and_needs_rehash."""
    valid, _ = verify_password_and_needs_rehash(plain_password, hashed_password)
    return valid

def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    """Creates a signed PyJWT token with HS256 algorithm and mandatory exp claim."""
    payload = data.copy()
    now = int(time.time())
    expire_seconds = expires_delta if expires_delta is not None else (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload["iat"] = now
    payload["exp"] = now + expire_seconds
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> Optional[dict]:
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

def get_or_create_demo_user(db: Session) -> User:
    """Returns or seeds the primary demo user 'demo@celestia.ai'."""
    demo_email = "demo@celestia.ai"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            name="Anjali & Rahul",
            password_hash=hash_password("celestia2026"),
            role="planner"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency returning the currently authenticated user.
    Strictly returns HTTP 401 Unauthorized if token is missing, expired, or invalid.
    No demo-user fallback.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    token = credentials.credentials
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
        
    return user
