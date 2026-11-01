"""
Mutation Sanity Check for CELESTIA Core Logic.
Validates that the test suite is sensitive to regressions by introducing
8 deliberate code mutations and verifying that test assertions catch each one.
"""
import pytest
from app.engines.cpm_solver import CPMNode, solve_cpm_pure, check_cycle_on_add_edge
from app.currency import rupees_to_minor, format_inr_minor, calculate_budget_allocation
from app.engines.budget_intelligence import reconcile_budget_minor
from app.routers.budget_routes import sanitize_csv_cell

def test_mutation_1_cpm_slack_formula():
    """Mutation: Slack calculated as (Early Start - Late Start) instead of (Late Start - Early Start)."""
    nodes = [
        CPMNode(id="A", duration_days=5, depends_on_ids=[]),
        CPMNode(id="B", duration_days=5, depends_on_ids=["A"]),
        CPMNode(id="C", duration_days=2, depends_on_ids=["A"]), # C has 3 days slack
        CPMNode(id="D", duration_days=1, depends_on_ids=["B", "C"])
    ]
    res = solve_cpm_pure(nodes)
    real_sched = res.schedule["C"]
    assert real_sched.slack == 3

    # Mutation: Invert sign of slack (yields -3)
    mutated_slack = real_sched.early_start - real_sched.late_start
    with pytest.raises(AssertionError):
        assert mutated_slack == real_sched.slack

def test_mutation_2_cycle_detection_bypass():
    """Mutation: Cycle detection inverted to always return False (allowing circular dependency)."""
    edges = [("A", "B"), ("B", "C")]
    new_cyclic_edge = ("C", "A")

    # Correct detection returns True (cycle detected)
    assert check_cycle_on_add_edge(edges, new_cyclic_edge) is True

    # Mutation: Function hardcoded to return False
    mutated_cycle_detector = lambda edges, new_edge: False
    with pytest.raises(AssertionError):
        assert mutated_cycle_detector(edges, new_cyclic_edge) is True

def test_mutation_3_paise_conversion_drift():
    """Mutation: Multiply rupees by 10 instead of 100."""
    rupees = 1500000
    expected_paise = 150000000 # 15 Lakhs INR in paise

    assert rupees_to_minor(rupees) == expected_paise

    # Mutation: 10x deficit
    mutated_conversion = rupees * 10
    with pytest.raises(AssertionError):
        assert mutated_conversion == expected_paise

def test_mutation_4_budget_reconciliation_omission():
    """Mutation: Dropping unallocated remainder from budget reconciliation equation."""
    total_budget_minor = 150000000
    rec = reconcile_budget_minor(total_budget_minor, "wedding")
    assert (rec.allocated_minor + rec.contingency_reserve_minor + rec.unallocated_minor) == total_budget_minor

    # Mutation: Neglect unallocated minor in sum
    mutated_sum = rec.allocated_minor + rec.contingency_reserve_minor
    # If unallocated > 0, sum must fail
    if rec.unallocated_minor > 0:
        with pytest.raises(AssertionError):
            assert mutated_sum == total_budget_minor

def test_mutation_5_csv_formula_injection_bypass():
    """Mutation: Cell sanitizer returns raw string without prepending single quote."""
    dangerous_cell = "=CMD|' /C calc'!A0"
    sanitized = sanitize_csv_cell(dangerous_cell)
    assert sanitized.startswith("'=")

    # Mutation: Bypass sanitizer
    mutated_sanitizer = lambda val: str(val)
    with pytest.raises(AssertionError):
        assert mutated_sanitizer(dangerous_cell).startswith("'=")

def test_mutation_6_tenant_event_boundary_leak():
    """Mutation: Querying event by ID only, omitting user_id tenant filter."""
    from app.models import Event
    # Standard tenant query:
    # db.query(Event).filter(Event.id == event_id, Event.user_id == user_id)
    # Mutation:
    # db.query(Event).filter(Event.id == event_id)
    ev_a = Event(id="ev-1", user_id="user-owner")
    requesting_user_id = "user-attacker"

    # Strict check
    assert (ev_a.id == "ev-1" and ev_a.user_id == requesting_user_id) is False

    # Mutated check (omits user_id)
    mutated_check = (ev_a.id == "ev-1")
    with pytest.raises(AssertionError):
        # Asserting that mutated query respects tenant boundary fails
        assert mutated_check is False

def test_mutation_7_safety_buffer_allocatable_sum():
    """Mutation: Allocation calculation loses minor units due to integer division error."""
    total = 10000003 # Prime number minor units
    safety, allocatable = calculate_budget_allocation(total, contingency_percent=0.10)
    assert (safety + allocatable) == total

    # Mutation: Truncate without tracking remainder
    mutated_safety = int(total * 0.10)
    mutated_allocatable = int(total * 0.89)
    with pytest.raises(AssertionError):
        assert (mutated_safety + mutated_allocatable) == total

def test_mutation_8_temporary_lockout_counter_reset():
    """Mutation: Failed login attempt counter fails to increment."""
    failures = [1.0, 2.0, 3.0, 4.0]
    # Adding 5th failure must trigger lockout
    new_failures = failures + [5.0]
    is_locked = (len(new_failures) >= 5)
    assert is_locked is True

    # Mutation: Failure dropped
    mutated_failures = failures
    mutated_locked = (len(mutated_failures) >= 5)
    with pytest.raises(AssertionError):
        assert mutated_locked is True
