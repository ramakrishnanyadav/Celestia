import pytest
import uuid
import time
from datetime import datetime, timezone, timedelta
from app.models import User, Event, Task, BudgetCategory, Expense, Approval, IdempotencyRecord
from app.auth import hash_password, create_access_token
from app.services.approval_service import ApprovalService
from app.idempotency import check_idempotency, record_idempotency
from app.engines.ai_efficiency import AIEfficiencyService

@pytest.fixture
def auth_context(db):
    user = User(
        email=f"harden_{uuid.uuid4().hex[:8]}@celestia.ai",
        name="Hardening Tester",
        password_hash=hash_password("password123"),
        role="planner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    event = Event(
        user_id=user.id,
        title="Hardening Test Royal Wedding",
        event_type="wedding",
        city="Mumbai",
        guest_count=300,
        budget_minor=150000000,
        currency="INR"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}
    return user, event, headers

# ============================================================================
# 1. OPTIMISTIC CONCURRENCY TESTS (HTTP 409 ON STALE VERSION)
# ============================================================================

def test_optimistic_concurrency_task_version_conflict(client, auth_context, db):
    user, event, headers = auth_context

    # Create initial task
    task = Task(
        event_id=event.id,
        title="Concurrent Floral Setup",
        category="Decor",
        milestone_name="1 Month Out",
        days_before_event=30,
        duration_days=3,
        version=1
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # User 1 successfully updates with expected_version=1
    res1 = client.patch(
        f"/api/events/{event.id}/tasks/{task.id}",
        json={"title": "Updated by User 1", "expected_version": 1},
        headers=headers
    )
    assert res1.status_code == 200
    assert res1.json()["version"] == 2
    assert res1.json()["title"] == "Updated by User 1"

    # User 2 attempts update with stale expected_version=1
    res2 = client.patch(
        f"/api/events/{event.id}/tasks/{task.id}",
        json={"title": "Stale Update by User 2", "expected_version": 1},
        headers=headers
    )
    assert res2.status_code == 409
    assert "Conflict" in res2.json()["detail"]
    assert "expected version 1, current version 2" in res2.json()["detail"]

def test_optimistic_concurrency_expense_version_conflict(client, auth_context, db):
    user, event, headers = auth_context

    cat = BudgetCategory(
        event_id=event.id,
        name="Catering",
        allocation_percent=30.0,
        allocated_amount_minor=45000000
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    exp = Expense(
        category_id=cat.id,
        name="Dinner Buffet",
        planned_amount_minor=40000000,
        actual_amount_minor=0,
        version=1
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Valid update with version=1 bumps to version=2
    r1 = client.patch(
        f"/api/events/{event.id}/budget/expenses/{exp.id}",
        json={"name": "Deluxe Dinner Buffet", "expected_version": 1},
        headers=headers
    )
    assert r1.status_code == 200
    assert r1.json()["version"] == 2

    # Stale update with version=1 fails with 409
    r2 = client.patch(
        f"/api/events/{event.id}/budget/expenses/{exp.id}",
        json={"name": "Conflicting Dinner Buffet", "expected_version": 1},
        headers=headers
    )
    assert r2.status_code == 409
    assert "Conflict" in r2.json()["detail"]

# ============================================================================
# 2. IDEMPOTENCY TESTS (SAME KEY, CHANGED PAYLOAD, SCOPING, EXPIRY)
# ============================================================================

def test_idempotency_same_key_returns_cached_response(client, auth_context):
    user, event, headers = auth_context
    key = f"idem-key-{uuid.uuid4().hex}"
    req_headers = {**headers, "Idempotency-Key": key}

    payload = {
        "title": "Idempotent Photography Booking",
        "category": "Photography",
        "milestone_name": "3 Months Out",
        "days_before_event": 90,
        "duration_days": 2
    }

    # First request
    r1 = client.post(f"/api/events/{event.id}/tasks", json=payload, headers=req_headers)
    assert r1.status_code == 200
    first_id = r1.json()["id"]

    # Duplicate request with same key and payload
    r2 = client.post(f"/api/events/{event.id}/tasks", json=payload, headers=req_headers)
    assert r2.status_code == 200
    assert r2.json()["id"] == first_id

def test_idempotency_changed_payload_is_rejected_with_422(client, auth_context):
    user, event, headers = auth_context
    key = f"idem-key-{uuid.uuid4().hex}"
    req_headers = {**headers, "Idempotency-Key": key}

    payload = {
        "title": "Original Mandap Setup",
        "category": "Decor",
        "milestone_name": "1 Month Out",
        "days_before_event": 30,
        "duration_days": 2
    }
    r1 = client.post(f"/api/events/{event.id}/tasks", json=payload, headers=req_headers)
    assert r1.status_code == 200

    # Tampered payload with same key
    tampered_payload = {**payload, "title": "Tampered Altered Title"}
    r2 = client.post(f"/api/events/{event.id}/tasks", json=tampered_payload, headers=req_headers)
    assert r2.status_code == 422
    assert "different request payload or endpoint" in r2.json()["detail"]

def test_idempotency_scoped_per_user(client, auth_context, db):
    user1, event1, headers1 = auth_context

    # Create a second distinct user
    user2 = User(
        email=f"user2_{uuid.uuid4().hex[:8]}@celestia.ai",
        name="Second Planner",
        password_hash=hash_password("password123")
    )
    db.add(user2)
    db.commit()
    db.refresh(user2)

    event2 = Event(
        user_id=user2.id,
        title="User 2 Wedding",
        event_type="wedding",
        city="Delhi",
        guest_count=200,
        budget_minor=100000000,
        currency="INR"
    )
    db.add(event2)
    db.commit()
    db.refresh(event2)

    token2 = create_access_token({"sub": user2.id, "email": user2.email, "role": user2.role})
    headers2 = {"Authorization": f"Bearer {token2}"}

    shared_key = f"scoped-user-key-{uuid.uuid4().hex}"
    payload1 = {"title": "Task User 1", "category": "Venue", "milestone_name": "M1", "days_before_event": 60, "duration_days": 1}
    payload2 = {"title": "Task User 2", "category": "Venue", "milestone_name": "M1", "days_before_event": 60, "duration_days": 1}

    # User 1 submits with shared_key
    r1 = client.post(f"/api/events/{event1.id}/tasks", json=payload1, headers={**headers1, "Idempotency-Key": shared_key})
    assert r1.status_code == 200

    # User 2 submits with the SAME key string but for their own event/user -> Allowed without conflict
    r2 = client.post(f"/api/events/{event2.id}/tasks", json=payload2, headers={**headers2, "Idempotency-Key": shared_key})
    assert r2.status_code == 200
    assert r1.json()["id"] != r2.json()["id"]

def test_idempotency_scoped_per_endpoint(client, auth_context):
    user, event, headers = auth_context
    key = f"scoped-endpoint-key-{uuid.uuid4().hex}"

    # Use key on create task
    payload_task = {"title": "Task A", "category": "Venue", "milestone_name": "M1", "days_before_event": 60, "duration_days": 1}
    r1 = client.post(f"/api/events/{event.id}/tasks", json=payload_task, headers={**headers, "Idempotency-Key": key})
    assert r1.status_code == 200

    # Reusing the same key on a different endpoint (e.g. generate-plan) is rejected
    r2 = client.post(f"/api/events/{event.id}/ai/generate-plan", headers={**headers, "Idempotency-Key": key})
    assert r2.status_code == 422
    assert "different request payload or endpoint" in r2.json()["detail"]

def test_idempotency_expiry(db, auth_context):
    user, event, headers = auth_context
    key = f"expiring-key-{uuid.uuid4().hex}"

    # Manually seed an expired record (older than TTL)
    old_time = datetime.now(timezone.utc) - timedelta(hours=25)
    rec = IdempotencyRecord(
        key=key,
        user_id=user.id,
        endpoint="test_endpoint",
        request_hash="dummy_hash",
        response_code=200,
        response_body={"cached": True},
        created_at=old_time
    )
    db.add(rec)
    db.commit()

    # Checking idempotency with TTL=86400s (24h) returns None because key has expired
    result = check_idempotency(db, key, user.id, "test_endpoint", {"any": "data"}, ttl_seconds=86400)
    assert result is None

    # Verify stale record was removed
    stale = db.query(IdempotencyRecord).filter(IdempotencyRecord.key == key).first()
    assert stale is None

# ============================================================================
# 3. APPROVALSERVICE TESTS (APPROVE, DOUBLE-APPROVE, ROLLBACK)
# ============================================================================

def test_approval_service_approve_double_approve_and_rollback(db, auth_context):
    user, event, headers = auth_context

    initial_guests = event.guest_count
    new_guests = 450

    # Create pending approval
    proposal = Approval(
        event_id=event.id,
        proposal_type="guest_scaling",
        title="Scale Guest Count to 450",
        summary="Increase guest count for extended family",
        proposed_changes_json={"new_guest_count": new_guests},
        diff_summary={"before": {"guest_count": initial_guests}, "after": {"guest_count": new_guests}},
        status="pending"
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    # 1. First Approve -> succeeds
    approved = ApprovalService.execute_action(db, event, proposal.id, action="approve")
    assert approved.status == "approved"
    assert approved.reviewed_at is not None
    assert event.guest_count == new_guests

    # 2. Double-Approve -> raises HTTP 409 Conflict
    with pytest.raises(Exception) as exc_info:
        ApprovalService.execute_action(db, event, proposal.id, action="approve")
    assert "409" in str(exc_info.value)
    assert "already approved" in str(exc_info.value).lower()

    # 3. Rollback -> restores event to original state and reverts status to pending
    rolled_back = ApprovalService.rollback_action(db, event, proposal.id)
    assert rolled_back.status == "pending"
    assert rolled_back.reviewed_at is None
    assert event.guest_count == initial_guests

# ============================================================================
# 4. SANITIZED 500 ERROR RESPONSE & REQUEST ID TESTS
# ============================================================================

def test_sanitized_500_error_response_no_traceback_leak(client):
    # Call fault diagnostic endpoint that raises ZeroDivisionError
    res = client.get("/api/test-fault/unhandled-error")
    assert res.status_code == 500
    assert res.headers["content-type"] == "application/json"

    data = res.json()
    assert data["error"] == "InternalServerError"
    assert data["message"] == "An unexpected server error occurred. Please try again."
    assert "request_id" in data
    assert len(data["request_id"]) > 10

    # Ensure zero traceback or python internals leaked to client
    body_text = res.text.lower()
    assert "traceback" not in body_text
    assert "zerodivisionerror" not in body_text
    assert "division by zero" not in body_text
    assert ".py" not in body_text

# ============================================================================
# 5. PROVIDER TIMEOUT FALLBACK TEST
# ============================================================================

def test_provider_timeout_fallback_in_parallel_engine(db, auth_context):
    user, event, headers = auth_context
    import asyncio

    t0 = time.perf_counter()
    # Provider hangs for 500ms, per-call timeout is 20ms
    plan = asyncio.run(AIEfficiencyService.generate_plan_parallel(
        event=event,
        timeout_sec=0.02,
        fake_delay=0.5
    ))
    elapsed = time.perf_counter() - t0

    assert plan is not None
    assert "sections" in plan
    assert elapsed < 0.25 # Responded immediately via fast fallback, did not stall for 500ms
    assert plan["sections"]["timeline"]["status"] == "template_fallback"
    assert plan["sections"]["vendor_matrix"]["status"] == "template_fallback"

# ============================================================================
# 6. ACTIVE DATABASE HEALTH CHECK TEST
# ============================================================================

def test_database_health_check_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"]["status"] == "connected"
    assert data["database"]["latency_ms"] >= 0
    assert "dialect" in data["database"]

