from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class FeasibilityResult:
    status: str # "feasible", "tight", "infeasible"
    per_guest_rupees: float
    min_recommended_per_guest_rupees: float
    min_recommended_budget_rupees: float
    reasons: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

TIER_1_CITIES = {
    "mumbai", "delhi", "new delhi", "bengaluru", "bangalore", 
    "chennai", "hyderabad", "kolkata"
}

TIER_2_CITIES = {
    "pune", "ahmedabad", "jaipur", "lucknow", "chandigarh", 
    "surat", "indore", "kochi", "nagpur", "bhopal", "patna", "vadodara"
}

MARKET_BENCHMARKS = {
    "wedding": {
        "tier1": {"min_per_guest": 2500.0, "comfortable_per_guest": 3500.0, "fixed_floor": 300000.0},
        "tier2": {"min_per_guest": 1800.0, "comfortable_per_guest": 2800.0, "fixed_floor": 200000.0},
        "other": {"min_per_guest": 1400.0, "comfortable_per_guest": 2200.0, "fixed_floor": 150000.0},
    },
    "birthday": {
        "tier1": {"min_per_guest": 1000.0, "comfortable_per_guest": 1800.0, "fixed_floor": 50000.0},
        "tier2": {"min_per_guest": 750.0, "comfortable_per_guest": 1300.0, "fixed_floor": 35000.0},
        "other": {"min_per_guest": 500.0, "comfortable_per_guest": 900.0, "fixed_floor": 25000.0},
    },
    "community": {
        "tier1": {"min_per_guest": 500.0, "comfortable_per_guest": 900.0, "fixed_floor": 100000.0},
        "tier2": {"min_per_guest": 350.0, "comfortable_per_guest": 650.0, "fixed_floor": 60000.0},
        "other": {"min_per_guest": 250.0, "comfortable_per_guest": 450.0, "fixed_floor": 40000.0},
    }
}

def get_city_tier(city: str) -> str:
    norm = city.strip().lower()
    if norm in TIER_1_CITIES:
        return "tier1"
    if norm in TIER_2_CITIES:
        return "tier2"
    return "other"

def check_event_feasibility(
    event_type: str,
    city: str,
    guest_count: int,
    budget_minor: int,
    dietary: str = "Pure Vegetarian",
    preparation_months: Optional[int] = None
) -> FeasibilityResult:
    """
    Deterministic Feasibility Engine:
    Validates celebration parameters against researched Indian market benchmarks.
    Detects when a proposed budget is unrealistic for the requested headcount, city, and event type.
    """
    e_type = event_type.strip().lower()
    benchmarks = MARKET_BENCHMARKS.get(e_type, MARKET_BENCHMARKS["wedding"])
    tier = get_city_tier(city)
    tier_bench = benchmarks[tier]

    min_per_guest = tier_bench["min_per_guest"]
    comfortable_per_guest = tier_bench["comfortable_per_guest"]
    fixed_floor = tier_bench["fixed_floor"]

    guest_count = max(1, guest_count)
    budget_rupees = round(budget_minor / 100.0, 2)
    per_guest_rupees = round(budget_rupees / guest_count, 2)

    # Minimum recommended budget is the greater of (fixed floor) and (guests * min_per_guest)
    min_recommended_budget_rupees = max(fixed_floor, min_per_guest * guest_count)

    reasons: List[str] = []
    recommendations: List[str] = []
    status = "feasible"

    if budget_rupees < fixed_floor:
        status = "infeasible"
        reasons.append(
            f"Total budget of ₹{budget_rupees:,.2f} is below the baseline venue and operational floor of ₹{fixed_floor:,.2f} in {city.capitalize()}."
        )
        recommendations.append(
            f"Increase total budget to at least ₹{min_recommended_budget_rupees:,.2f} to cover fixed banquet and infrastructure commitments."
        )
    elif per_guest_rupees < min_per_guest:
        status = "infeasible"
        reasons.append(
            f"Allocated ₹{per_guest_rupees:,.2f}/guest is below the market minimum of ₹{min_per_guest:,.2f}/guest for {dietary} {e_type.capitalize()} events in {city.capitalize()}."
        )
        recommendations.append(
            f"In {city.capitalize()}, standard catering and venue minimums start at ₹{min_per_guest:,.2f}/head. For {guest_count} guests, target at least ₹{min_recommended_budget_rupees:,.2f}."
        )
    elif per_guest_rupees < comfortable_per_guest:
        status = "tight"
        reasons.append(
            f"Budget of ₹{per_guest_rupees:,.2f}/guest is workable but tight (comfortable benchmark is ₹{comfortable_per_guest:,.2f}/guest)."
        )
        recommendations.append(
            f"Keep catering menus focused on high-quality signature regional specialties rather than excessive live counters to protect contingency reserves."
        )
    else:
        status = "feasible"
        reasons.append(
            f"Budget of ₹{per_guest_rupees:,.2f}/guest provides healthy headroom above the ₹{min_per_guest:,.2f}/guest baseline."
        )
        recommendations.append(
            f"Balanced budget allows full premium decor, live classical music, and dedicated guest hospitality."
        )

    # Lead time advisory
    if preparation_months is not None and preparation_months < 2 and e_type == "wedding":
        reasons.append(
            f"Preparation timeline of {preparation_months} month(s) is urgent for a traditional wedding."
        )
        recommendations.append(
            "Prioritize venue and caterer locking immediately to avoid rush-booking surcharges."
        )

    return FeasibilityResult(
        status=status,
        per_guest_rupees=per_guest_rupees,
        min_recommended_per_guest_rupees=min_per_guest,
        min_recommended_budget_rupees=min_recommended_budget_rupees,
        reasons=reasons,
        recommendations=recommendations
    )

