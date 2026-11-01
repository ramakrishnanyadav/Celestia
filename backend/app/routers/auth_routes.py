import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..auth import (
    DUMMY_ARGON2_HASH,
    clear_auth_cookies,
    create_access_token,
    create_ephemeral_demo_user,
    create_refresh_token,
    get_current_user,
    get_user_active_sessions,
    hash_password,
    revoke_all_user_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
    set_auth_cookies,
    validate_password_strength,
    verify_password_and_needs_rehash,
)
from ..config import settings
from ..database import get_db
from ..engines.ai_service import AIService
from ..models import Event, EventPreference, User
from ..rate_limiter import get_client_ip, limiter, rate_limit_auth
from ..schemas import (
    PasswordChangeRequest,
    SessionResponse,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(
    user_in: UserCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _rl = Depends(rate_limit_auth)
):
    get_client_ip(request)
    validate_password_strength(user_in.password)
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already registered"
        )
    user = User(
        email=user_in.email,
        name=user_in.name,
        password_hash=hash_password(user_in.password),
        role="planner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(db, user.id)
    csrf_token = secrets.token_hex(24)

    set_auth_cookies(response, access_token, refresh_token, csrf_token)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token
    }

@router.post("/login", response_model=Token)
def login(
    login_in: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _rl = Depends(rate_limit_auth)
):
    ip = get_client_ip(request)
    lockout_key = f"failed_login:{ip}:{login_in.email.lower()}"
    limiter.check_lockout(lockout_key)

    user = db.query(User).filter(User.email == login_in.email).first()
    if not user:
        # Constant-time timing defense against account enumeration: run full dummy Argon2 hash check
        verify_password_and_needs_rehash(login_in.password, DUMMY_ARGON2_HASH)
        limiter.record_failed_login(lockout_key, max_failures=5, lockout_duration_seconds=900)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    valid, needs_rehash = verify_password_and_needs_rehash(login_in.password, user.password_hash)
    if not valid:
        limiter.record_failed_login(lockout_key, max_failures=5, lockout_duration_seconds=900)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Clear failed login attempts on success
    limiter.clear_failed_logins(lockout_key)

    if needs_rehash:
        user.password_hash = hash_password(login_in.password)
        db.commit()
        db.refresh(user)

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(db, user.id)
    csrf_token = secrets.token_hex(24)

    set_auth_cookies(response, access_token, refresh_token, csrf_token)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token
    }

@router.post("/refresh", response_model=Token)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _rl = Depends(rate_limit_auth)
):
    """Rotates refresh token and issues a new access token."""
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        # Check Authorization header fallback
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr and auth_hdr.startswith("Bearer "):
            raw_token = auth_hdr[7:]

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user, new_access_token, new_refresh_token = rotate_refresh_token(db, raw_token)
    csrf_token = secrets.token_hex(24)
    set_auth_cookies(response, new_access_token, new_refresh_token, csrf_token)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "user": user,
        "refresh_token": new_refresh_token,
        "csrf_token": csrf_token
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Revokes refresh token and clears all auth cookies."""
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        revoke_refresh_token(db, raw_token)
    clear_auth_cookies(response)
    return {"status": "success", "message": "Logged out successfully"}

@router.post("/logout-all")
def logout_all_sessions(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revokes all active refresh tokens for the current user and clears auth cookies."""
    count = revoke_all_user_tokens(db, current_user.id)
    clear_auth_cookies(response)
    return {
        "status": "success",
        "message": f"Successfully revoked all {count} active sessions and logged out across all devices."
    }

@router.get("/sessions", response_model=list[SessionResponse])
def get_user_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all active non-expired sessions for the user with an is_current indicator."""
    current_raw = request.cookies.get("refresh_token")
    return get_user_active_sessions(db, current_user.id, current_raw)

@router.post("/change-password")
def change_password(
    pwd_in: PasswordChangeRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _rl = Depends(rate_limit_auth)
):
    """
    Changes user password:
    1. Verifies existing old password.
    2. Validates new password strength & breach check (NIST/HIBP).
    3. Re-hashes password with Argon2id.
    4. Invalidates ALL existing refresh tokens to prevent session hijacking.
    5. Issues a new token pair and sets fresh cookies.
    """
    if current_user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password modification is disabled on demonstration accounts."
        )

    valid, _ = verify_password_and_needs_rehash(pwd_in.old_password, current_user.password_hash)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    validate_password_strength(pwd_in.new_password)

    # Invalidate all prior sessions immediately
    revoke_all_user_tokens(db, current_user.id)

    # Set new password
    current_user.password_hash = hash_password(pwd_in.new_password)
    db.commit()
    db.refresh(current_user)

    # Issue fresh session
    access_token = create_access_token({"sub": current_user.id, "email": current_user.email})
    refresh_token = create_refresh_token(db, current_user.id)
    csrf_token = secrets.token_hex(24)

    set_auth_cookies(response, access_token, refresh_token, csrf_token)
    return {
        "status": "success",
        "message": "Password changed successfully. All previous sessions have been invalidated.",
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "csrf_token": csrf_token
    }

@router.post("/demo-login", response_model=Token)
def demo_login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    _rl = Depends(rate_limit_auth)
):
    """
    Creates a fresh temporary demonstration session.
    Controlled by DEMO_ACCOUNT_ENABLED (strictly off by default in production).
    Seeds the authentic Mumbai wedding showcase with full budget and timeline.
    """
    if not settings.DEMO_ACCOUNT_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo showcase is disabled in production environments."
        )

    demo_user = create_ephemeral_demo_user(db)

    # Seed authentic Mumbai Indian Wedding showcase
    wedding_event = Event(
        user_id=demo_user.id,
        title="Anjali & Rahul's Royal Mumbai Wedding",
        event_type="wedding",
        city="Mumbai",
        venue_type="Grand Banquet Hall",
        guest_count=300,
        budget_minor=150000000, # ₹15 Lakhs in paise
        currency="INR",
        timezone="Asia/Kolkata",
        preparation_months=6,
        status="planning",
        autonomy_mode="Draft"
    )
    db.add(wedding_event)
    db.commit()
    db.refresh(wedding_event)

    pref = EventPreference(
        event_id=wedding_event.id,
        dietary="Pure Vegetarian",
        theme="Royal Marigold & Polished Brass",
        regional_culture="Maharashtrian Traditional",
        cultural_traditions=["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"],
        music_entertainment="Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ",
        color_palette=["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"],
        special_requirements="Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts."
    )
    db.add(pref)
    db.commit()

    AIService.generate_full_event_plan(db, wedding_event)

    access_token = create_access_token({"sub": demo_user.id, "email": demo_user.email})
    refresh_token = create_refresh_token(db, demo_user.id)
    csrf_token = secrets.token_hex(24)

    set_auth_cookies(response, access_token, refresh_token, csrf_token)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": demo_user,
        "refresh_token": refresh_token,
        "csrf_token": csrf_token
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/export")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Data portability endpoint (GDPR/DPDP compliance).
    Exports complete user account history, celebrations, budgets, tasks, and vendors.
    """
    events_data = []
    events = db.query(Event).filter(Event.user_id == current_user.id).all()
    for ev in events:
        ev_dict = {
            "id": ev.id,
            "title": ev.title,
            "event_type": ev.event_type,
            "city": ev.city,
            "guest_count": ev.guest_count,
            "budget_minor": ev.budget_minor,
            "timezone": ev.timezone,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
            "tasks": [
                {
                    "title": t.title,
                    "category": t.category,
                    "duration_days": t.duration_days,
                    "status": t.status,
                    "is_critical": t.is_critical
                }
                for t in ev.tasks
            ],
            "budget_categories": [
                {
                    "name": bc.name,
                    "allocated_amount_minor": bc.allocated_amount_minor,
                    "expenses": [
                        {
                            "name": ex.name,
                            "planned_minor": ex.planned_amount_minor,
                            "actual_minor": ex.actual_amount_minor,
                            "provenance": ex.provenance
                        }
                        for ex in bc.expenses
                    ]
                }
                for bc in ev.budget_categories
            ]
        }
        events_data.append(ev_dict)

    return {
        "account": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "events": events_data
    }

@router.delete("/account")
def delete_user_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes user account and all associated events via cascading deletion.
    Revokes tokens and clears cookies.
    """
    if current_user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demonstration celebration accounts are read-only and cannot be deleted."
        )

    db.delete(current_user)
    db.commit()
    clear_auth_cookies(response)
    return {"status": "deleted", "message": "Account and all associated celebration data permanently removed."}
