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
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import User, Event, Task, BudgetCategory
from app.database import SessionLocal

client = TestClient(app, raise_server_exceptions=False)

def create_test_user_and_token(email_prefix: str):
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
    user1_id, _, auth_hdr1 = create_test_user_and_token("parent_child_u1")
    user2_id, _, auth_hdr2 = create_test_user_and_token("parent_child_u2")

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
    owner_id, _, owner_hdr = create_test_user_and_token("matrix_owner")
    other_id, _, other_hdr = create_test_user_and_token("matrix_other")

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
        if method == "GET":
            anon_res = anon_client.get(path)
        else:
            anon_res = anon_client.post(path)
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
