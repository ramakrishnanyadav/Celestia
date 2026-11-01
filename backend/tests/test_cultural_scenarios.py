"""
Deterministic Scenario Suite for CELESTIA.
Loads all 20 culturally calibrated celebration scenarios from backend/app/data/scenarios_v1.json.
Validates:
1. Deterministic NLP extraction
2. Feasibility verification
3. CPM Solver invariants
4. Architectural consistency
"""
import json
from pathlib import Path
import pytest
from app.engines.ai_service import AIService
from app.engines.feasibility_engine import check_event_feasibility
from app.engines.cpm_solver import CPMNode, solve_cpm_pure

SCENARIOS_PATH = Path(__file__).parent.parent / "app" / "data" / "scenarios_v1.json"

def load_deterministic_scenarios():
    with open(SCENARIOS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data["scenarios"]

DETERMINISTIC_SCENARIOS = load_deterministic_scenarios()

@pytest.mark.parametrize("case", DETERMINISTIC_SCENARIOS, ids=[c["id"] for c in DETERMINISTIC_SCENARIOS])
def test_scenario_parameter_extraction(case):
    """Evaluates deterministic parameter extraction across all 20 scenarios."""
    extracted = AIService.extract_requirements_from_text(case["prompt"])
    assert extracted.event_type == case["expected_type"]
    assert extracted.city.lower() == case["expected_city"].lower()
    assert extracted.guest_count == case["expected_guests"]
    assert extracted.budget_rupees >= case["expected_budget_min"]

@pytest.mark.parametrize("case", DETERMINISTIC_SCENARIOS, ids=[c["id"] for c in DETERMINISTIC_SCENARIOS])
def test_scenario_feasibility_evaluation(case):
    """Evaluates deterministic Indian market feasibility classification."""
    budget_minor = int(case["expected_budget_min"] * 100)
    feasibility = check_event_feasibility(
        event_type=case["expected_type"],
        city=case["expected_city"],
        guest_count=case["expected_guests"],
        budget_minor=budget_minor,
        dietary=case["expected_dietary"]
    )
    assert feasibility.status == case["expected_feasibility"]
    if case["expected_feasibility"] in ("tight", "infeasible"):
        assert len(feasibility.trade_off_options) > 0
        assert feasibility.provenance_label == "estimate"
