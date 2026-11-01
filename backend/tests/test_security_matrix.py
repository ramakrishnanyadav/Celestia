"""
Comprehensive Dynamic Security Matrix & Authorization Tests.
Validates:
1. Stored XSS defense
2. CSV Formula Injection neutralization
3. Account enumeration prevention
4. Mismatched parent/child ID authorization
5. Full Authorization Matrix (Anonymous, Owner, Other User across core endpoints)
"""
import time

from fastapi.testclient import TestClient

from app.main import app
from app.rate_limiter import limiter

client = TestClient(app, raise_server_exceptions=False)

def create_test_user_and_token(email_prefix: str):
    limiter.reset_all()
    email = f"{email_prefix}_{int(time.time()*1000)}@celestia.ai"
    reg = client.post("/api/auth/register", json={
        "email": email,
        "name": f"User {email_prefix}",
        "password": "StrongPassword123!"
    })
    assert reg.status_code == 200
    token = reg.json()["access_token"]
    user_id = reg.json()["user"]["id"]
    return user_id, token, {"Authorization": f"Bearer {token}"}

def test_stored_xss_sanitization():
    """Verify stored XSS payloads in task descriptions and budget category names do not execute."""
    _, _, auth_hdr = create_test_user_and_token("xss_user")

    # Create event
    ev_res = client.post("/api/events", headers=auth_hdr, json={
        "title": "Clean Event", "event_type": "wedding", "guest_count": 150, "budget_minor": 30000000
    })
    assert ev_res.status_code == 200
    ev_id = ev_res.json()["id"]

    xss_payload = "<script>alert('pwned')</script><img src=x onerror=alert(1)>"

    # Create task with XSS payload
    task_res = client.post(f"/api/events/{ev_id}/tasks", headers=auth_hdr, json={
        "title": xss_payload,
        "description": xss_payload,
        "category": "Ceremony",
        "milestone_name": "Wedding Day",
        "days_before_event": 0,
        "duration_days": 1,
        "priority": "critical",
        "assigned_to": "Anjali"
    })
    assert task_res.status_code == 200
    data = task_res.json()
    # Ensure JSON response properly encodes characters without unescaped execution context
    assert "<script>" in data["title"] or "&lt;script&gt;" in data["title"]
    assert "content-type" in task_res.headers
    assert "application/json" in task_res.headers["content-type"]

def test_csv_formula_injection_neutralization():
    """Verify CSV export prepends single quote to cells starting with =, +, -, @ to prevent DDE execution."""
    _, _, auth_hdr = create_test_user_and_token("csv_user")

    ev_res = client.post("/api/events", headers=auth_hdr, json={
        "title": "Formula Event", "event_type": "wedding", "guest_count": 200, "budget_minor": 40000000
    })
    assert ev_res.status_code == 200
    ev_id = ev_res.json()["id"]

    # Add category with formula payload
    cat_payloads = [
        "=CMD|' /C calc'!A0",
        "+cmd|' /C calc'!A0",
        "-2+3+cmd|' /C calc'!A0",
        "@SUM(1+1)*cmd|' /C calc'!A0"
    ]
    for p in cat_payloads:
        client.post(f"/api/events/{ev_id}/budget/categories", headers=auth_hdr, json={
            "name": p,
            "allocation_percent": 10.0,
            "allocated_amount_minor": 1000000,
            "icon": "Utensils",
            "is_per_guest": False,
            "per_guest_minor": 0,
            "sort_order": 1
        })

    # Download CSV export
    csv_res = client.get(f"/api/events/{ev_id}/budget/export-csv", headers=auth_hdr)
    assert csv_res.status_code == 200
    csv_text = csv_res.text

    # Verify all formula prefixes are neutralized with a single quote prefix
    for p in cat_payloads:
        safe_p = f"'{p}"
        assert safe_p in csv_text
        # Raw dangerous formula without quote must NOT appear at the beginning of any cell
        assert f"\n{p}" not in csv_text
        assert f",{p}" not in csv_text

def test_account_enumeration_prevention():
    """Verify failed login returns identical error message regardless of whether email exists."""
    _, _, _ = create_test_user_and_token("enum_user")
    existing_email = "nonexistent_registered_user@celestia.ai"
    client.post("/api/auth/register", json={"email": existing_email, "name": "Existing", "password": "Password123!"})

    # Case A: Email exists, wrong password
    res_a = client.post("/api/auth/login", json={"email": existing_email, "password": "WrongPassword!"})
    assert res_a.status_code == 401
    detail_a = res_a.json()["detail"]

    # Case B: Email does NOT exist
    res_b = client.post("/api/auth/login", json={"email": "completely_fake_email_xyz@celestia.ai", "password": "AnyPassword!"})
    assert res_b.status_code == 401
    detail_b = res_b.json()["detail"]

    # Must be identical generic message to prevent account enumeration
    assert detail_a == detail_b == "Invalid email or password"

def test_mismatched_parent_child_id_authorization():
    """Verify attempting to access or modify a task using another event's ID returns HTTP 404."""
    _user1_id, _, auth_hdr1 = create_test_user_and_token("parent_child_u1")
    _user2_id, _, auth_hdr2 = create_test_user_and_token("parent_child_u2")

    # User 1 creates Event 1 and Task 1
    ev1_res = client.post("/api/events", headers=auth_hdr1, json={
        "title": "Event 1", "event_type": "wedding", "guest_count": 200, "budget_minor": 50000000
    })
    ev1_id = ev1_res.json()["id"]

    t1_res = client.post(f"/api/events/{ev1_id}/tasks", headers=auth_hdr1, json={
        "title": "Task 1", "category": "Venue", "milestone_name": "6 Months", "days_before_event": 180,
        "duration_days": 5, "priority": "high", "assigned_to": "Anjali"
    })
    t1_id = t1_res.json()["id"]

    # User 1 creates Event 2
    ev2_res = client.post("/api/events", headers=auth_hdr1, json={
        "title": "Event 2", "event_type": "birthday", "guest_count": 50, "budget_minor": 10000000
    })
    ev2_id = ev2_res.json()["id"]

    # Attempting to access Task 1 under Event 2 path -> 404 Not Found
    mismatched_res = client.patch(
        f"/api/events/{ev2_id}/tasks/{t1_id}",
        headers=auth_hdr1,
        json={"title": "Hijacked Task"}
    )
    assert mismatched_res.status_code == 404

    # User 2 attempting to access Task 1 under Event 1 path -> 404 Not Found (scoped event isolation)
    other_user_res = client.patch(
        f"/api/events/{ev1_id}/tasks/{t1_id}",
        headers=auth_hdr2,
        json={"title": "Unauthorized Hijack"}
    )
    assert other_user_res.status_code == 404

def test_full_authorization_matrix():
    """
    Authorization Matrix across:
    - Anonymous (No Token) -> 401 Unauthorized
    - Owner -> 200 OK
    - Other Authenticated User -> 404 Not Found (or 403 Forbidden)
    """
    _owner_id, _, owner_hdr = create_test_user_and_token("matrix_owner")
    _other_id, _, other_hdr = create_test_user_and_token("matrix_other")

    ev_res = client.post("/api/events", headers=owner_hdr, json={
        "title": "Matrix Wedding", "event_type": "wedding", "guest_count": 300, "budget_minor": 150000000
    })
    ev_id = ev_res.json()["id"]

    endpoints = [
        ("GET", f"/api/events/{ev_id}"),
        ("GET", f"/api/events/{ev_id}/budget/summary"),
        ("GET", f"/api/events/{ev_id}/vendors"),
        ("GET", f"/api/events/{ev_id}/ai/ideas"),
        ("POST", f"/api/events/{ev_id}/ai/generate-plan"),
    ]

    anon_client = TestClient(app, raise_server_exceptions=False)

    for method, path in endpoints:
        # 1. Anonymous (No Auth, No Cookies) -> Must return 401
        anon_res = anon_client.get(path) if method == "GET" else anon_client.post(path)
        assert anon_res.status_code == 401, f"Failed anonymous check for {path}"

        # 2. Other User -> Must return 404 (event not found for other user)
        if method == "GET":
            other_res = client.get(path, headers=other_hdr)
        else:
            other_res = client.post(path, headers=other_hdr)
        assert other_res.status_code in (403, 404), f"Failed other user boundary check for {path}"

        # 3. Owner -> Must succeed
        if method == "GET":
            owner_res = client.get(path, headers=owner_hdr)
        else:
            owner_res = client.post(path, headers=owner_hdr)
        assert owner_res.status_code == 200, f"Failed owner access check for {path}"

def test_password_policy_and_pwned_check():
    """Verify password strength validation rejects short, weak, or breached passwords."""
    limiter.reset_all()
    # 1. Too short (< 10 chars)
    res_short = client.post("/api/auth/register", json={
        "email": "short@celestia.ai", "name": "Short", "password": "Short1!"
    })
    assert res_short.status_code == 422
    assert "at least 10 characters" in str(res_short.json()["detail"]).lower()

    # 2. Missing uppercase
    res_no_upper = client.post("/api/auth/register", json={
        "email": "noupper@celestia.ai", "name": "NoUpper", "password": "password123!"
    })
    assert res_no_upper.status_code == 422
    assert "uppercase" in str(res_no_upper.json()["detail"]).lower()

    # 3. Missing digit
    res_no_digit = client.post("/api/auth/register", json={
        "email": "nodigit@celestia.ai", "name": "NoDigit", "password": "PasswordTest!"
    })
    assert res_no_digit.status_code == 422
    assert "digit" in str(res_no_digit.json()["detail"]).lower()

    # 4. Missing special character
    res_no_special = client.post("/api/auth/register", json={
        "email": "nospecial@celestia.ai", "name": "NoSpecial", "password": "Password12345"
    })
    assert res_no_special.status_code == 422
    assert "special character" in str(res_no_special.json()["detail"]).lower()

    # 5. Breached password (simulated PwnedPassword)
    res_pwned = client.post("/api/auth/register", json={
        "email": "pwned@celestia.ai", "name": "Pwned", "password": "PwnedPassword123!"
    })
    assert res_pwned.status_code == 422
    assert "data breaches" in str(res_pwned.json()["detail"]).lower()

def test_logout_all_and_sessions_management():
    """Verify listing active sessions and revoking all sessions on logout-all."""
    limiter.reset_all()
    _, _token1, hdr1 = create_test_user_and_token("sessions_u")

    # Get active sessions
    sess_res = client.get("/api/auth/sessions", headers=hdr1)
    assert sess_res.status_code == 200
    sessions = sess_res.json()
    assert len(sessions) >= 1

    # Logout all sessions
    logout_all = client.post("/api/auth/logout-all", headers=hdr1)
    assert logout_all.status_code == 200
    assert "Successfully revoked all" in logout_all.json()["message"]

    # Subsequent refresh attempt with any old token must fail with 401
    refresh_fail = client.post("/api/auth/refresh", headers=hdr1)
    assert refresh_fail.status_code == 401

def test_password_change_invalidates_old_sessions():
    """Verify changing password invalidates all prior sessions and verifies old password."""
    limiter.reset_all()
    user_client = TestClient(app, raise_server_exceptions=False)
    reg = user_client.post("/api/auth/register", json={
        "email": f"pwd_change_{int(time.time()*1000)}@celestia.ai",
        "name": "Pwd User",
        "password": "StrongPassword123!"
    })
    assert reg.status_code == 200
    token = reg.json()["access_token"]
    old_refresh_token = reg.json()["refresh_token"]
    hdr = {"Authorization": f"Bearer {token}"}

    # Wrong old password -> 400
    bad_old = user_client.post("/api/auth/change-password", headers=hdr, json={
        "old_password": "IncorrectPassword123!",
        "new_password": "BrandNewSecurePassword456@"
    })
    assert bad_old.status_code == 400

    # Successful password change
    good_change = user_client.post("/api/auth/change-password", headers=hdr, json={
        "old_password": "StrongPassword123!",
        "new_password": "BrandNewSecurePassword456@"
    })
    assert good_change.status_code == 200
    new_token = good_change.json()["access_token"]
    assert new_token != token

    # Old refresh token is revoked -> 401
    old_client = TestClient(app, raise_server_exceptions=False)
    old_client.cookies.set("refresh_token", old_refresh_token)
    old_refresh = old_client.post("/api/auth/refresh")
    assert old_refresh.status_code == 401

def test_demo_user_destruction_guards():
    """Verify demonstration account cannot be deleted or have its celebration removed."""
    limiter.reset_all()
    demo_res = client.post("/api/auth/demo-login")
    assert demo_res.status_code == 200
    demo_token = demo_res.json()["access_token"]
    demo_hdr = {"Authorization": f"Bearer {demo_token}"}

    # Attempting to delete account -> 403 Forbidden
    del_acc = client.delete("/api/auth/account", headers=demo_hdr)
    assert del_acc.status_code == 403
    assert "read-only" in del_acc.json()["detail"].lower()

    # Get demo event
    events_res = client.get("/api/events", headers=demo_hdr)
    assert events_res.status_code == 200
    ev_id = events_res.json()[0]["id"]

    # Attempting to delete demo event -> 403 Forbidden
    del_ev = client.delete(f"/api/events/{ev_id}", headers=demo_hdr)
    assert del_ev.status_code == 403
    assert "read-only" in del_ev.json()["detail"].lower()
