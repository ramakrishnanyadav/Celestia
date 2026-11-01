import time

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import create_access_token, hash_password, verify_password
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import User

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function", autouse=True)
def setup_security_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create User A
    user_a = User(
        id="user-a-uuid",
        email="user_a@celestia.ai",
        name="User A",
        password_hash=hash_password("passwordA123"),
        role="planner"
    )
    # Create User B
    user_b = User(
        id="user-b-uuid",
        email="user_b@celestia.ai",
        name="User B",
        password_hash=hash_password("passwordB123"),
        role="planner"
    )
    db.add_all([user_a, user_b])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def token_user_a():
    return create_access_token({"sub": "user-a-uuid"})

@pytest.fixture
def token_user_b():
    return create_access_token({"sub": "user-b-uuid"})

# ============================================================================
# 1. AUTHENTICATION: ELIMINATE DEMO-USER FALLBACK (STRICT 401)
# ============================================================================

def test_missing_token_returns_401(client):
    """Calling protected endpoints without token must return 401 Unauthorized, NOT demo user."""
    res = client.get("/api/events")
    assert res.status_code == 401
    assert "detail" in res.json()

def test_invalid_token_returns_401(client):
    """Calling protected endpoints with invalid or forged token returns 401."""
    res = client.get("/api/events", headers={"Authorization": "Bearer totally-fake-token"})
    assert res.status_code == 401

def test_expired_token_returns_401(client):
    """Calling protected endpoints with expired token returns 401."""
    # Create an already expired token
    expired_payload = {
        "sub": "user-a-uuid",
        "exp": int(time.time()) - 100
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm="HS256")
    res = client.get("/api/events", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401

def test_demo_login_endpoint(client):
    """POST /api/auth/demo-login returns real JWT for seeded demo account."""
    res = client.post("/api/auth/demo-login")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["is_demo"] is True
    assert "@celestia.demo" in data["user"]["email"]

    # Token must be usable
    ev_res = client.get("/api/events", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert ev_res.status_code == 200

# ============================================================================
# 2. ARGON2ID PASSWORD HASHING & SEAMLESS RE-HASH
# ============================================================================

def test_argon2id_hashing():
    """Verify passwords are hashed with Argon2id ($argon2id$)."""
    pwd = "SecurePassword2026!"
    hashed = hash_password(pwd)
    assert hashed.startswith("$argon2id$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_legacy_pbkdf2_rehash_on_login(client):
    """Verify legacy PBKDF2 hash verifies and gets transparently upgraded to Argon2id on login."""
    db = TestingSessionLocal()
    # Insert a user with legacy PBKDF2 hash
    import base64
    import hashlib
    salt = "celestia_salt_indian_wedding_2026"
    raw_hash = hashlib.pbkdf2_hmac('sha256', b"legacyPass123", salt.encode('utf-8'), 100000)
    legacy_hash = base64.b64encode(raw_hash).decode('utf-8')

    legacy_user = User(
        id="legacy-user-id",
        email="legacy@celestia.ai",
        name="Legacy User",
        password_hash=legacy_hash,
        role="planner"
    )
    db.add(legacy_user)
    db.commit()
    db.close()

    # Login with legacy credentials
    res = client.post("/api/auth/login", json={
        "email": "legacy@celestia.ai",
        "password": "legacyPass123"
    })
    assert res.status_code == 200

    # Verify that in database, password_hash has been upgraded to Argon2id
    db = TestingSessionLocal()
    updated_user = db.query(User).filter(User.id == "legacy-user-id").first()
    assert updated_user.password_hash.startswith("$argon2id$")
    db.close()

# ============================================================================
# 3. PYJWT HS256 & ALGORITHM PINNING
# ============================================================================

def test_pyjwt_algorithm_pinning(client):
    """Verify forged algorithm (none or public key) is rejected by PyJWT."""
    # Forged 'none' algorithm token
    forged_token = jwt.encode({"sub": "user-a-uuid", "exp": int(time.time()) + 3600}, key="", algorithm="none")
    res = client.get("/api/events", headers={"Authorization": f"Bearer {forged_token}"})
    assert res.status_code == 401

# ============================================================================
# 4. CHILD-RESOURCE AUTHORIZATION & HORIZONTAL DATA ISOLATION
# ============================================================================

def test_child_resource_horizontal_isolation(client, token_user_a, token_user_b):
    """
    Verify User B cannot access or mutate User A's events, tasks, budget, or approvals.
    Must return 403 Forbidden or 404 Not Found.
    """
    headers_a = {"Authorization": f"Bearer {token_user_a}"}
    headers_b = {"Authorization": f"Bearer {token_user_b}"}

    # User A creates an event
    ev_a = client.post("/api/events", json={
        "title": "User A Royal Wedding",
        "guest_count": 300,
        "budget_minor": 150000000
    }, headers=headers_a).json()
    event_id = ev_a["id"]

    # User A creates a task
    task_a = client.post(f"/api/events/{event_id}/tasks", json={
        "title": "Private Venue Contract",
        "duration_days": 5
    }, headers=headers_a).json()
    task_id = task_a["id"]

    # 1. User B attempts to GET User A's event
    res = client.get(f"/api/events/{event_id}", headers=headers_b)
    assert res.status_code in (403, 404)

    # 2. User B attempts to GET User A's tasks
    res = client.get(f"/api/events/{event_id}/tasks", headers=headers_b)
    assert res.status_code in (403, 404)

    # 3. User B attempts to UPDATE User A's task
    res = client.patch(f"/api/events/{event_id}/tasks/{task_id}", json={
        "title": "Hijacked Task"
    }, headers=headers_b)
    assert res.status_code in (403, 404)

    # 4. User B attempts to DELETE User A's task
    res = client.delete(f"/api/events/{event_id}/tasks/{task_id}", headers=headers_b)
    assert res.status_code in (403, 404)

    # 5. User B attempts to GET User A's budget summary
    res = client.get(f"/api/events/{event_id}/budget/summary", headers=headers_b)
    assert res.status_code in (403, 404)

    # 6. User B attempts to GET User A's vendors
    res = client.get(f"/api/events/{event_id}/vendors/compare", headers=headers_b)
    assert res.status_code in (403, 404)

# ============================================================================
# 5. SECURITY HEADERS
# ============================================================================

def test_security_headers_present(client):
    """Verify production security headers on HTTP responses."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin" in res.headers.get("Referrer-Policy", "")
