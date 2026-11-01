"""
Comprehensive CPM Graph Structure & Mutation Verification Tests.
Tests Diamond Graphs, Disconnected Graphs, and verifies the Slack Formula Invariant.
"""
import pytest
from app.engines.cpm_solver import CPMNode, solve_cpm_pure, check_cycle_on_add_edge

def test_cpm_diamond_graph():
    r"""
    Diamond Graph:
           /-- B (10 days) --\
      A (5)                    D (3 days)
           \-- C (4 days)  --/
    Longest path: A (5) + B (10) + D (3) = 18 days.
    Critical path: A -> B -> D.
    Non-critical path: C (slack = 6 days).
    """
    nodes = [
        CPMNode(id="A", duration_days=5, depends_on_ids=[]),
        CPMNode(id="B", duration_days=10, depends_on_ids=["A"]),
        CPMNode(id="C", duration_days=4, depends_on_ids=["A"]),
        CPMNode(id="D", duration_days=3, depends_on_ids=["B", "C"]),
    ]
    result = solve_cpm_pure(nodes)

    assert result.has_cycle is False
    assert result.total_duration_days == 18
    assert set(result.critical_path_ids) == {"A", "B", "D"}

    # Task C slack: Early Start = 5, Early Finish = 9. Late Finish = 15, Late Start = 11.
    # Slack = 11 - 5 = 6 days.
    assert result.schedule["C"].slack == 6
    assert result.schedule["C"].is_critical is False
    assert result.schedule["B"].slack == 0
    assert result.schedule["B"].is_critical is True

def test_cpm_disconnected_subgraphs():
    """
    Two completely independent subgraphs in the same celebration project:
    Subgraph 1 (Rituals): R1 (7 days) -> R2 (14 days) = 21 days total
    Subgraph 2 (Music): M1 (3 days) -> M2 (5 days) = 8 days total
    Project duration must be max(21, 8) = 21 days.
    Critical path must be R1, R2.
    Music tasks M1, M2 must have 13 days of slack (21 - 8).
    """
    nodes = [
        CPMNode(id="R1", duration_days=7, depends_on_ids=[]),
        CPMNode(id="R2", duration_days=14, depends_on_ids=["R1"]),
        CPMNode(id="M1", duration_days=3, depends_on_ids=[]),
        CPMNode(id="M2", duration_days=5, depends_on_ids=["M1"]),
    ]
    result = solve_cpm_pure(nodes)

    assert result.has_cycle is False
    assert result.total_duration_days == 21
    assert set(result.critical_path_ids) == {"R1", "R2"}

    assert result.schedule["R1"].slack == 0
    assert result.schedule["R2"].slack == 0
    assert result.schedule["M1"].slack == 13
    assert result.schedule["M2"].slack == 13

def test_cpm_slack_formula_mutation_check():
    """
    Verifies that the canonical definition of total slack:
    Slack = Late Start - Early Start == Late Finish - Early Finish
    holds across all nodes, and verifies sensitivity against formula mutations.
    """
    nodes = [
        CPMNode(id="Start", duration_days=2, depends_on_ids=[]),
        CPMNode(id="Path1", duration_days=8, depends_on_ids=["Start"]),
        CPMNode(id="Path2", duration_days=3, depends_on_ids=["Start"]),
        CPMNode(id="End", duration_days=4, depends_on_ids=["Path1", "Path2"]),
    ]
    result = solve_cpm_pure(nodes)
    assert not result.has_cycle

    for nid, sched in result.schedule.items():
        # Correct formula
        expected_slack = sched.late_start - sched.early_start
        assert sched.slack == expected_slack
        assert (sched.late_finish - sched.early_finish) == expected_slack

        # Deliberate mutation 1: late_finish - early_start (inflated slack)
        mutated_slack_1 = sched.late_finish - sched.early_start
        if nid == "Path2":
            assert mutated_slack_1 != sched.slack, "Failed to catch inflated slack mutation"

        # Deliberate mutation 2: early_start - late_start (inverted sign)
        mutated_slack_2 = sched.early_start - sched.late_start
        if nid == "Path2":
            assert mutated_slack_2 != sched.slack, "Failed to catch inverted sign mutation"
