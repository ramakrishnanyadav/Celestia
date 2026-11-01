from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Approval, Event, User

# Setup in-memory SQLite for fast isolated testing
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
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create test user
    user = User(
        id="user-m1-test",
        email="test_m1@celestia.ai",
        name="Anjali & Rahul",
        password_hash=hash_password("celestia2026"),
        role="planner"
    )
    db.add(user)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "user-m1-test"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_client():
    return TestClient(app)

# ============================================================================
# 1. PURE CPM GRAPH SOLVER TESTS (Zero DB inside)
# ============================================================================

def test_pure_cpm_solver_linear_chain():
    """Verify CPM calculates correct Early/Late starts and marks all tasks critical in a single chain."""
    from app.engines.cpm_solver import CPMNode, solve_cpm_pure

    nodes = [
        CPMNode(id="A", duration_days=5, depends_on_ids=[]),
        CPMNode(id="B", duration_days=10, depends_on_ids=["A"]),
        CPMNode(id="C", duration_days=3, depends_on_ids=["B"]),
    ]

    result = solve_cpm_pure(nodes)
    assert not result.has_cycle
    assert result.total_duration_days == 18
    assert set(result.critical_path_ids) == {"A", "B", "C"}

    sched = result.schedule
    assert sched["A"].early_start == 0
    assert sched["A"].early_finish == 5
    assert sched["A"].late_start == 0
    assert sched["A"].late_finish == 5
    assert sched["A"].slack == 0

    assert sched["B"].early_start == 5
    assert sched["B"].early_finish == 15
    assert sched["B"].slack == 0

    assert sched["C"].early_start == 15
    assert sched["C"].early_finish == 18
    assert sched["C"].slack == 0

def test_pure_cpm_solver_branching_slack():
    """Verify CPM correctly computes slack on non-critical branch in diamond DAG."""
    from app.engines.cpm_solver import CPMNode, solve_cpm_pure

    # A -> B (10 days) -> D
    # A -> C (4 days)  -> D
    nodes = [
        CPMNode(id="A", duration_days=5, depends_on_ids=[]),
        CPMNode(id="B", duration_days=10, depends_on_ids=["A"]),
        CPMNode(id="C", duration_days=4, depends_on_ids=["A"]),
        CPMNode(id="D", duration_days=2, depends_on_ids=["B", "C"]),
    ]

    result = solve_cpm_pure(nodes)
    assert not result.has_cycle
    assert result.total_duration_days == 17 # 5 + 10 + 2
    assert set(result.critical_path_ids) == {"A", "B", "D"}

    # C should have slack of 10 - 4 = 6 days
    assert result.schedule["C"].slack == 6
    assert not result.schedule["C"].is_critical
    assert result.schedule["B"].slack == 0
    assert result.schedule["B"].is_critical

def test_pure_cpm_solver_detects_cycle():
    """Verify CPM solver detects circular dependencies and raises/flags cycle."""
    from app.engines.cpm_solver import CPMNode, solve_cpm_pure

    # A -> B -> C -> A
    nodes = [
        CPMNode(id="A", duration_days=5, depends_on_ids=["C"]),
        CPMNode(id="B", duration_days=5, depends_on_ids=["A"]),
        CPMNode(id="C", duration_days=5, depends_on_ids=["B"]),
    ]

    result = solve_cpm_pure(nodes)
    assert result.has_cycle
    assert len(result.critical_path_ids) == 0

def test_pure_cpm_check_cycle_on_add_edge():
    """Verify pure function detects if adding an edge introduces a cycle."""
    from app.engines.cpm_solver import check_cycle_on_add_edge

    existing_edges = [
        ("A", "B"), # A -> B
        ("B", "C"), # B -> C
        ("C", "D"), # C -> D
    ]

    # Adding D -> A introduces cycle
    assert check_cycle_on_add_edge(existing_edges, new_edge=("D", "A")) is True
    # Adding self-loop introduces cycle
    assert check_cycle_on_add_edge(existing_edges, new_edge=("A", "A")) is True
    # Adding valid forward edge A -> D does NOT introduce cycle
    assert check_cycle_on_add_edge(existing_edges, new_edge=("A", "D")) is False
    # Adding independent edge X -> Y does NOT introduce cycle
    assert check_cycle_on_add_edge(existing_edges, new_edge=("X", "Y")) is False

# ============================================================================
# 2. EXACT INTEGER BUDGET RECONCILIATION TESTS
# ============================================================================

def test_exact_integer_budget_reconciliation_zero_drift():
    """Verify that total_budget_minor == allocated + contingency + unallocated down to 1 paisa."""
    from app.engines.budget_intelligence import reconcile_budget_minor

    # Test multiple arbitrary budget values including odd numbers with potential remainder
    budgets = [
        150000000, # 15 Lakhs
        150000137, # Odd paise
        35000000,  # 3.5 Lakhs
        80000000,  # 8 Lakhs
        1000000,   # 10,000 INR
        9999999999 # Large odd number
    ]

    for b in budgets:
        recon = reconcile_budget_minor(
            total_budget_minor=b,
            event_type="wedding"
        )
        assert recon.is_reconciled
        assert recon.total_budget_minor == (
            recon.allocated_minor + recon.contingency_reserve_minor + recon.unallocated_minor
        )
        assert recon.contingency_reserve_minor == (b * 10) // 100
        # Remainder should always be zero drift
        assert recon.unallocated_minor >= 0

# ============================================================================
# 3. DETERMINISTIC FEASIBILITY CHECK RULES
# ============================================================================

def test_deterministic_feasibility_rules():
    """Verify feasibility engine applies real Indian market ranges per guest."""
    from app.engines.feasibility_engine import check_event_feasibility

    # Case 1: Mumbai Wedding 300 guests, 15 Lakhs (5,000/head) -> Feasible
    res1 = check_event_feasibility(
        event_type="wedding",
        city="Mumbai",
        guest_count=300,
        budget_minor=150000000, # 15L
        dietary="Pure Vegetarian"
    )
    assert res1.status == "feasible"
    assert res1.per_guest_rupees == 5000.0
    assert res1.min_recommended_per_guest_rupees == 2500.0

    # Case 2: Mumbai Wedding 300 guests, 5 Lakhs (1,666/head) -> Infeasible (Below ₹2,500/head threshold)
    res2 = check_event_feasibility(
        event_type="wedding",
        city="Mumbai",
        guest_count=300,
        budget_minor=50000000, # 5L
        dietary="Pure Vegetarian"
    )
    assert res2.status == "infeasible"
    assert "₹2,500" in res2.recommendations[0] or "₹2,500" in res2.reasons[0]

    # Case 3: Mumbai Birthday 80 guests, 3.5 Lakhs (4,375/head) -> Feasible
    res3 = check_event_feasibility(
        event_type="birthday",
        city="Mumbai",
        guest_count=80,
        budget_minor=35000000
    )
    assert res3.status == "feasible"

# ============================================================================
# 4. INPUT BOUNDS VALIDATION TESTS
# ============================================================================

def test_event_input_bounds_rejected(test_client, auth_headers):
    """Verify HTTP 422 Unprocessable Entity when inputs violate defined min/max bounds."""
    # Guest count too low (< 10)
    res = test_client.post("/api/events", json={
        "title": "Tiny Celebration",
        "guest_count": 5, # Minimum is 10
        "budget_minor": 150000000,
        "preparation_months": 6
    }, headers=auth_headers)
    assert res.status_code == 422

    # Guest count too high (> 5000)
    res = test_client.post("/api/events", json={
        "title": "Mega Gathering",
        "guest_count": 10000, # Maximum is 5000
        "budget_minor": 150000000,
        "preparation_months": 6
    }, headers=auth_headers)
    assert res.status_code == 422

    # Budget too low (< 10,000 INR = 1,000,000 paise)
    res = test_client.post("/api/events", json={
        "title": "Underfunded Celebration",
        "guest_count": 50,
        "budget_minor": 500000, # 5,000 INR
        "preparation_months": 6
    }, headers=auth_headers)
    assert res.status_code == 422

    # Preparation months out of bounds (> 36)
    res = test_client.post("/api/events", json={
        "title": "Distant Celebration",
        "guest_count": 50,
        "budget_minor": 150000000,
        "preparation_months": 48
    }, headers=auth_headers)
    assert res.status_code == 422

def test_expense_input_bounds_rejected(test_client, auth_headers):
    """Verify HTTP 422 when expense amount is <= 0."""
    # Create valid event first
    ev_res = test_client.post("/api/events", json={
        "title": "Bounds Test Event",
        "guest_count": 100,
        "budget_minor": 150000000,
        "preparation_months": 6
    }, headers=auth_headers)
    assert ev_res.status_code == 200
    event_id = ev_res.json()["id"]

    # Get category
    b_res = test_client.get(f"/api/events/{event_id}/budget/summary", headers=auth_headers)
    cat_id = b_res.json()["categories"][0]["id"]

    # Try adding expense with 0 amount
    exp_res = test_client.post(
        f"/api/events/{event_id}/budget/categories/{cat_id}/expenses",
        json={"name": "Free Service", "planned_amount_minor": 0},
        headers=auth_headers
    )
    assert exp_res.status_code == 422

# ============================================================================
# 5. ATOMIC & IDEMPOTENT APPROVAL TESTS
# ============================================================================

def test_atomic_approval_execution_row_count(test_client, auth_headers):
    """Verify atomic update ensures duplicate approval returns 409 Conflict."""
    db = TestingSessionLocal()
    # Create event and proposal
    event = Event(
        id="ev-approval-test",
        user_id="user-m1-test",
        title="Approval Test Event",
        event_type="wedding",
        guest_count=300,
        budget_minor=150000000
    )
    db.add(event)
    db.flush()

    proposal = Approval(
        id="prop-test-atomic",
        event_id="ev-approval-test",
        proposal_type="guest_scaling",
        title="Scale guests to 350",
        summary="Scaling guest count",
        proposed_changes_json={"new_guest_count": 350},
        status="pending"
    )
    db.add(proposal)
    db.commit()
    db.close()

    # First call: approve -> 200 OK
    res1 = test_client.post(
        "/api/events/ev-approval-test/approvals/prop-test-atomic/action",
        json={"action": "approve"},
        headers=auth_headers
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "approved"

    # Second call: approve again -> 409 Conflict
    res2 = test_client.post(
        "/api/events/ev-approval-test/approvals/prop-test-atomic/action",
        json={"action": "approve"},
        headers=auth_headers
    )
    assert res2.status_code == 409
    assert "already approved" in res2.json()["detail"].lower()

# ============================================================================
# 6. TIMEZONE & DATE EXPLICIT HANDLING
# ============================================================================

def test_explicit_timezone_handling(test_client, auth_headers):
    """Verify events and records explicitly record and handle Asia/Kolkata timezone."""
    res = test_client.post("/api/events", json={
        "title": "Timezone Verification Event",
        "guest_count": 200,
        "budget_minor": 150000000,
        "preparation_months": 6,
        "timezone": "Asia/Kolkata"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["timezone"] == "Asia/Kolkata"

    # Created_at must be an ISO 8601 string
    created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
    assert created_at.tzinfo is not None

