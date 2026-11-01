import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.auth import create_access_token, hash_password
from app.database import Base, SessionLocal, engine
from app.engines.budget_intelligence import (
    calculate_budget_summary,
    paise_to_rupees,
    rupees_to_paise,
    seed_event_budget,
)
from app.main import app
from app.models import Approval, BudgetCategory, Event, User

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def create_test_event(db):
    uid = str(uuid.uuid4())[:8]
    user = User(
        email=f"test_{uid}@celestia.ai",
        name="Test Planner",
        password_hash=hash_password("testpass123"),
        role="planner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    event = Event(
        user_id=user.id,
        title="Test Correctness Wedding",
        event_type="wedding",
        city="Mumbai",
        venue_type="Banquet Hall",
        guest_count=300,
        budget_minor=150000000, # ₹15,00,000 in paise
        currency="INR",
        timezone="Asia/Kolkata",
        preparation_months=6,
        status="planning"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    token = create_access_token({"sub": user.id, "email": user.email})
    return user, event, token

def test_integer_money_math_precision():
    """Verify that integer paise math does not lose pennies/fractions and sums exactly match."""
    db = SessionLocal()
    try:
        _user, event, _token = create_test_event(db)
        seed_event_budget(db, event)
        categories = db.query(BudgetCategory).filter(BudgetCategory.event_id == event.id).all()
        summary = calculate_budget_summary(event, categories)

        # Contingency must be exact integer 10%
        expected_contingency = (event.budget_minor * 10) // 100
        assert summary["contingency_reserve_minor"] == expected_contingency

        # Allocations must never exceed allocatable budget
        allocatable = event.budget_minor - expected_contingency
        assert summary["allocated_minor"] <= allocatable

        # Exact conversion roundtrip
        assert rupees_to_paise(1500000.00) == 150000000
        assert paise_to_rupees(150000000) == 1500000.00
    finally:
        db.close()

def test_cycle_detection_in_task_dependencies():
    """Creating a cycle (A -> B -> A or self A -> A) must be rejected with 400 Bad Request."""
    db = SessionLocal()
    try:
        _user, event, token = create_test_event(db)
        headers = {"Authorization": f"Bearer {token}"}

        # Create Task A
        res_a = client.post(f"/api/events/{event.id}/tasks", json={
            "title": "Task A",
            "category": "Venue",
            "milestone_name": "Stage 1",
            "days_before_event": 60,
            "duration_days": 5,
            "priority": "high",
            "depends_on_ids": []
        }, headers=headers)
        assert res_a.status_code == 200
        task_a_id = res_a.json()["id"]

        # Create Task B depending on Task A
        res_b = client.post(f"/api/events/{event.id}/tasks", json={
            "title": "Task B",
            "category": "Decor",
            "milestone_name": "Stage 1",
            "days_before_event": 55,
            "duration_days": 3,
            "priority": "medium",
            "depends_on_ids": [task_a_id]
        }, headers=headers)
        assert res_b.status_code == 200
        task_b_id = res_b.json()["id"]

        # Attempt to create Task C that introduces cycle: Task A depends on Task B and C depends on both
        # Or create self-dependency
        res_self = client.post(f"/api/events/{event.id}/tasks", json={
            "title": "Task Self",
            "category": "Decor",
            "milestone_name": "Stage 1",
            "days_before_event": 50,
            "duration_days": 2,
            "priority": "low",
            "depends_on_ids": [task_a_id, task_b_id]
        }, headers=headers)
        assert res_self.status_code == 200
        task_c_id = res_self.json()["id"]

        # Now attempt to add cyclic dependency: Task A depends on Task C
        # Must fail with 400 Circular dependency detected
        res_cycle = client.post(f"/api/events/{event.id}/tasks", json={
            "title": "Task Cycle Maker",
            "category": "Decor",
            "milestone_name": "Stage 1",
            "days_before_event": 45,
            "duration_days": 2,
            "priority": "high",
            "depends_on_ids": [task_c_id]
        }, headers=headers)
        cycle_maker_id = res_cycle.json()["id"]

        # If Task A is updated or dependency added back to cycle_maker -> must fail
        res_update_cycle = client.post(f"/api/events/{event.id}/tasks/{task_a_id}/dependencies", json={
            "depends_on_task_id": cycle_maker_id
        }, headers=headers)
        assert res_update_cycle.status_code in [400, 422]
        assert "circular" in res_update_cycle.text.lower() or "cycle" in res_update_cycle.text.lower()
    finally:
        db.close()

def test_atomic_approval_execution_prevents_double_approval():
    """Double-approving an approval proposal must be rejected atomically (409 Conflict)."""
    db = SessionLocal()
    try:
        _user, event, token = create_test_event(db)
        headers = {"Authorization": f"Bearer {token}"}

        proposal = Approval(
            event_id=event.id,
            proposal_type="guest_scaling",
            title="Scale to 350 Guests",
            summary="Recalculates per-head catering",
            diff_summary={},
            proposed_changes_json={"new_guest_count": 350},
            status="pending"
        )
        db.add(proposal)
        db.commit()
        db.refresh(proposal)

        # First approval must succeed
        res1 = client.post(
            f"/api/events/{event.id}/approvals/{proposal.id}/action",
            json={"action": "approve"},
            headers=headers
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "approved"

        # Second approval attempt must fail atomically with 409 Conflict
        res2 = client.post(
            f"/api/events/{event.id}/approvals/{proposal.id}/action",
            json={"action": "approve"},
            headers=headers
        )
        assert res2.status_code == 409
        assert "already" in res2.text.lower()
    finally:
        db.close()

def test_numeric_bounds_validation():
    """Unbounded or negative inputs must be rejected with 422 Unprocessable Entity."""
    db = SessionLocal()
    try:
        _user, event, token = create_test_event(db)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Negative guest count
        res_neg_guests = client.post("/api/events/", json={
            "title": "Bad Event",
            "event_type": "wedding",
            "city": "Mumbai",
            "guest_count": -10,
            "budget_rupees": 1000000.0
        }, headers=headers)
        assert res_neg_guests.status_code == 422

        # 2. Outrageous guest count
        res_huge_guests = client.post("/api/events/", json={
            "title": "Huge Event",
            "event_type": "wedding",
            "city": "Mumbai",
            "guest_count": 10000000,
            "budget_rupees": 1000000.0
        }, headers=headers)
        assert res_huge_guests.status_code == 422

        # 3. Negative budget
        res_neg_budget = client.post("/api/events/", json={
            "title": "Bad Budget",
            "event_type": "wedding",
            "city": "Mumbai",
            "guest_count": 100,
            "budget_rupees": -500.0
        }, headers=headers)
        assert res_neg_budget.status_code == 422

        # 4. Out of bounds task duration
        res_bad_task = client.post(f"/api/events/{event.id}/tasks", json={
            "title": "Negative Duration Task",
            "category": "Decor",
            "milestone_name": "Stage 1",
            "days_before_event": 30,
            "duration_days": -5,
            "priority": "medium",
            "depends_on_ids": []
        }, headers=headers)
        assert res_bad_task.status_code == 422
    finally:
        db.close()

def test_db_check_constraints_enforced():
    """Database schema must enforce CHECK constraints on columns directly."""
    db = SessionLocal()
    try:
        user, _event, _token = create_test_event(db)
        # Attempt to insert an event with negative budget directly into DB session
        bad_event = Event(
            user_id=user.id,
            title="Constraint Test Event",
            event_type="wedding",
            city="Mumbai",
            guest_count=-50, # violates check_event_guest_count
            budget_minor=10000,
            currency="INR",
            timezone="Asia/Kolkata",
            status="planning"
        )
        db.add(bad_event)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    finally:
        db.close()

def test_optimistic_concurrency_rejects_stale_update():
    """Updating a task or expense with a stale expected_version must fail with 409 Conflict."""
    db = SessionLocal()
    try:
        _user, event, token = create_test_event(db)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a task
        res = client.post(f"/api/events/{event.id}/tasks", json={
            "title": "Versioned Task",
            "category": "Venue",
            "milestone_name": "Stage 1",
            "days_before_event": 60,
            "duration_days": 5
        }, headers=headers)
        assert res.status_code == 200
        task_data = res.json()
        task_id = task_data["id"]
        assert task_data["version"] == 1

        # 2. First update with expected_version=1 succeeds and bumps version to 2
        res_update1 = client.patch(f"/api/events/{event.id}/tasks/{task_id}", json={
            "title": "Versioned Task Updated",
            "expected_version": 1
        }, headers=headers)
        assert res_update1.status_code == 200
        assert res_update1.json()["version"] == 2

        # 3. Second concurrent update with stale expected_version=1 must be rejected with 409 Conflict
        res_update2 = client.patch(f"/api/events/{event.id}/tasks/{task_id}", json={
            "title": "Concurrent Overwrite Attempt",
            "expected_version": 1
        }, headers=headers)
        assert res_update2.status_code == 409
        assert "conflict" in res_update2.text.lower() or "modified" in res_update2.text.lower()
    finally:
        db.close()

def test_optimistic_concurrency_categories_and_expenses():
    """Optimistic concurrency must prevent stale overwrites on categories and expenses."""
    db = SessionLocal()
    try:
        _user, event, token = create_test_event(db)
        headers = {"Authorization": f"Bearer {token}"}

        # Create Category
        res_cat = client.post(f"/api/events/{event.id}/budget/categories", json={
            "name": "Catering",
            "allocation_percent": 30.0,
            "allocated_amount_minor": 30000000,
            "icon": "Utensils",
            "is_per_guest": True,
            "per_guest_minor": 150000,
            "sort_order": 1
        }, headers=headers)
        assert res_cat.status_code == 200
        cat_id = res_cat.json()["id"]
        assert res_cat.json()["version"] == 1

        # Successful update bumps version to 2
        res_up1 = client.patch(f"/api/events/{event.id}/budget/categories/{cat_id}", json={
            "name": "Royal Catering",
            "expected_version": 1
        }, headers=headers)
        assert res_up1.status_code == 200
        assert res_up1.json()["version"] == 2

        # Stale update with version 1 fails with 409 Conflict
        res_stale = client.patch(f"/api/events/{event.id}/budget/categories/{cat_id}", json={
            "name": "Stale Catering",
            "expected_version": 1
        }, headers=headers)
        assert res_stale.status_code == 409

        # Create Expense
        res_exp = client.post(f"/api/events/{event.id}/budget/categories/{cat_id}/expenses", json={
            "name": "Dinner Buffet",
            "planned_amount_minor": 10000000,
            "actual_amount_minor": 0,
            "provenance": "estimated"
        }, headers=headers)
        assert res_exp.status_code == 200
        exp_id = res_exp.json()["id"]
        assert res_exp.json()["version"] == 1

        # Expense stale update fails
        res_exp_stale = client.patch(f"/api/events/{event.id}/budget/expenses/{exp_id}", json={
            "name": "Overwritten Buffet",
            "expected_version": 99
        }, headers=headers)
        assert res_exp_stale.status_code == 409
    finally:
        db.close()

def test_idempotency_create_endpoints_and_generate_plan():
    """Duplicate requests with same Idempotency-Key must return identical cached responses, and payload mismatches must return 422."""
    db = SessionLocal()
    try:
        _user, event, token = create_test_event(db)
        headers = {"Authorization": f"Bearer {token}"}

        # Test Task Creation Idempotency
        idem_key = f"idem-task-{uuid.uuid4().hex[:8]}"
        task_payload = {
            "title": "Idempotent Task",
            "category": "Decor",
            "milestone_name": "Stage 1",
            "days_before_event": 40,
            "duration_days": 3
        }

        # First request
        res1 = client.post(
            f"/api/events/{event.id}/tasks",
            json=task_payload,
            headers={**headers, "Idempotency-Key": idem_key}
        )
        assert res1.status_code == 200
        created_id = res1.json()["id"]

        # Duplicate request with same key and payload returns identical cached response
        res2 = client.post(
            f"/api/events/{event.id}/tasks",
            json=task_payload,
            headers={**headers, "Idempotency-Key": idem_key}
        )
        assert res2.status_code == 200
        assert res2.json()["id"] == created_id
        assert res2.json()["title"] == "Idempotent Task"

        # Reusing key with different payload returns 422 Unprocessable Entity
        res_mismatch = client.post(
            f"/api/events/{event.id}/tasks",
            json={**task_payload, "title": "Tampered Payload"},
            headers={**headers, "Idempotency-Key": idem_key}
        )
        assert res_mismatch.status_code == 422
        assert "previously used with a different request payload" in res_mismatch.text

        # Test Generate Plan Idempotency
        plan_key = f"idem-plan-{uuid.uuid4().hex[:8]}"
        res_plan1 = client.post(
            f"/api/events/{event.id}/ai/generate-plan",
            headers={**headers, "Idempotency-Key": plan_key}
        )
        assert res_plan1.status_code == 200
        plan_title = res_plan1.json()["plan_title"]

        res_plan2 = client.post(
            f"/api/events/{event.id}/ai/generate-plan",
            headers={**headers, "Idempotency-Key": plan_key}
        )
        assert res_plan2.status_code == 200
        assert res_plan2.json()["plan_title"] == plan_title
    finally:
        db.close()


