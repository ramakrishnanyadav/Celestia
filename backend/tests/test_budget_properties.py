"""
Hypothesis Property-Based Tests for CELESTIA Monetary & Ledger Invariants.
Validates algebraic correctness across thousands of pseudorandom financial inputs.
"""
from hypothesis import given
from hypothesis import strategies as st

from app.currency import (
    calculate_budget_allocation,
    format_inr_compact,
    format_inr_minor,
    minor_to_rupees,
    rupees_to_minor,
)
from app.engines.budget_intelligence import reconcile_budget_minor
from app.engines.cpm_solver import CPMNode, solve_cpm_pure


@given(st.integers(min_value=0, max_value=10_000_000_000))
def test_budget_reconciliation_invariant(total_minor: int):
    """
    Property: For ANY valid total budget in minor units, the sum of allocated,
    contingency reserve, and unallocated remainder must EXACTLY equal the total budget.
    Zero floating-point loss down to 1 paisa.
    """
    rec = reconcile_budget_minor(total_minor, event_type="wedding")
    assert rec.is_reconciled is True
    assert (rec.allocated_minor + rec.contingency_reserve_minor + rec.unallocated_minor) == total_minor
    assert rec.allocated_minor >= 0
    assert rec.contingency_reserve_minor >= 0
    assert rec.unallocated_minor >= 0

@given(st.integers(min_value=0, max_value=10_000_000_000))
def test_budget_allocation_sum_invariant(total_minor: int):
    """
    Property: Safety buffer + allocatable amount == total budget minor units.
    """
    safety, allocatable = calculate_budget_allocation(total_minor, contingency_percent=0.10)
    assert safety + allocatable == total_minor
    assert safety >= 0
    assert allocatable >= 0

@given(st.integers(min_value=0, max_value=10_000_000_000))
def test_minor_currency_formatting_properties(minor: int):
    """
    Property: Indian formatting strings never contain float artifacts (NaN, inf)
    and always start with ₹ symbol.
    """
    formatted = format_inr_minor(minor, show_paise=True)
    assert formatted.startswith("₹")
    assert "nan" not in formatted.lower()
    assert "inf" not in formatted.lower()
    assert "e+" not in formatted.lower()

    # Compact notation
    compact = format_inr_compact(minor)
    assert compact.startswith("₹")

def test_currency_edge_cases_and_parsing():
    """Verify parsing string currency representations, negatives, and compact notation."""
    from app.currency import format_inr_compact, format_inr_minor

    assert rupees_to_minor("₹15,00,000") == 150000000
    assert rupees_to_minor("₹15,00,000.50") == 150000050
    assert rupees_to_minor("100") == 10000
    assert rupees_to_minor("-₹500.25") == -50025
    assert rupees_to_minor("") == 0
    assert minor_to_rupees(150000050) == 1500000.50

    assert format_inr_minor(-150000000) == "-₹15,00,000"
    assert format_inr_compact(150000000) == "₹15 L"
    assert format_inr_compact(1500000000) == "₹1.50 Cr"
    assert format_inr_compact(5000000) == "₹50 K"
    assert format_inr_compact(50000) == "₹500"

@given(st.integers(min_value=1, max_value=100), st.integers(min_value=1, max_value=100))
def test_cpm_slack_algebraic_invariant(d1: int, d2: int):
    """
    Property: In any CPM schedule, Total Slack identically equals:
    (Late Start - Early Start) AND (Late Finish - Early Finish).
    Any mutation in the slack formula will violate this mathematical property.
    """
    nodes = [
        CPMNode(id="A", duration_days=d1, depends_on_ids=[]),
        CPMNode(id="B", duration_days=d2, depends_on_ids=["A"])
    ]
    res = solve_cpm_pure(nodes)
    assert not res.has_cycle
    for _nid, sched in res.schedule.items():
        slack_ls_es = sched.late_start - sched.early_start
        slack_lf_ef = sched.late_finish - sched.early_finish
        assert sched.slack == slack_ls_es
        assert sched.slack == slack_lf_ef
        assert slack_ls_es == slack_lf_ef
