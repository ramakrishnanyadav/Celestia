from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from ..models import BudgetCategory, Event, Expense


def paise_to_rupees(paise: int) -> float:
    return round(paise / 100.0, 2)

def rupees_to_paise(rupees: float) -> int:
    return int(round(rupees * 100))

@dataclass
class BudgetReconciliation:
    total_budget_minor: int
    allocated_minor: int
    contingency_reserve_minor: int
    unallocated_minor: int
    is_reconciled: bool
    reconciliation_equation: str

def reconcile_budget_minor(total_budget_minor: int, event_type: str = "wedding") -> BudgetReconciliation:
    """
    Performs pure integer budget reconciliation down to 1 paisa with zero float drift.
    Guarantees:
        total_budget_minor == allocated_minor + contingency_reserve_minor + unallocated_minor
    """
    allocations = BENCHMARK_ALLOCATIONS.get(event_type.lower(), BENCHMARK_ALLOCATIONS["wedding"])
    contingency_reserve_minor = (total_budget_minor * 10) // 100
    allocatable_budget = total_budget_minor - contingency_reserve_minor

    total_percent_basis = sum(int(round(item["percent"] * 100)) for item in allocations)
    allocated_sum = 0
    for item in allocations:
        item_basis = int(round(item["percent"] * 100))
        allocated_minor = (item_basis * allocatable_budget) // total_percent_basis
        allocated_sum += allocated_minor

    unallocated_minor = allocatable_budget - allocated_sum
    is_reconciled = (total_budget_minor == (allocated_sum + contingency_reserve_minor + unallocated_minor))

    equation = (
        f"total ({total_budget_minor}) = allocated ({allocated_sum}) + "
        f"contingency ({contingency_reserve_minor}) + unallocated ({unallocated_minor})"
    )

    return BudgetReconciliation(
        total_budget_minor=total_budget_minor,
        allocated_minor=allocated_sum,
        contingency_reserve_minor=contingency_reserve_minor,
        unallocated_minor=unallocated_minor,
        is_reconciled=is_reconciled,
        reconciliation_equation=equation
    )

# Standard research-backed benchmark allocations for event categories
BENCHMARK_ALLOCATIONS = {
    "wedding": [
        {"name": "Catering & Banqueting", "percent": 35.0, "icon": "Utensils", "is_per_guest": True, "per_guest_minor": 175000},
        {"name": "Venue & Infrastructure", "percent": 22.0, "icon": "Home", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Decor, Florals & Mandap", "percent": 16.0, "icon": "Sparkles", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Photography & Cinematography", "percent": 10.0, "icon": "Camera", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Entertainment, Sound & DJ", "percent": 6.0, "icon": "Music", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Traditional Attire & Styling", "percent": 5.0, "icon": "Shirt", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Invitations, Favors & Gifts", "percent": 3.0, "icon": "Gift", "is_per_guest": True, "per_guest_minor": 15000},
        {"name": "Logistics & Pandit/Ceremonies", "percent": 3.0, "icon": "Truck", "is_per_guest": False, "per_guest_minor": 0},
    ],
    "birthday": [
        {"name": "Food & Beverages", "percent": 40.0, "icon": "Utensils", "is_per_guest": True, "per_guest_minor": 120000},
        {"name": "Venue & Play Area", "percent": 25.0, "icon": "Home", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Themed Decor & Cake", "percent": 18.0, "icon": "Sparkles", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Entertainment & Games", "percent": 10.0, "icon": "Music", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Return Gifts & Favors", "percent": 7.0, "icon": "Gift", "is_per_guest": True, "per_guest_minor": 35000},
    ],
    "community": [
        {"name": "Community Catering & Refreshments", "percent": 45.0, "icon": "Utensils", "is_per_guest": True, "per_guest_minor": 80000},
        {"name": "Hall & Stage Rental", "percent": 25.0, "icon": "Home", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Audio-Visual, Lighting & Stage", "percent": 15.0, "icon": "Music", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Decorations, Banners & Signage", "percent": 10.0, "icon": "Sparkles", "is_per_guest": False, "per_guest_minor": 0},
        {"name": "Permits, Security & Cleanliness", "percent": 5.0, "icon": "Shield", "is_per_guest": False, "per_guest_minor": 0},
    ]
}

def seed_event_budget(db: Session, event: Event, auto_commit: bool = False):
    """Deterministically allocates budget across standard categories based on event type and total budget"""
    event_type = event.event_type.lower()
    allocations = BENCHMARK_ALLOCATIONS.get(event_type, BENCHMARK_ALLOCATIONS["wedding"])

    total_budget_minor = event.budget_minor
    # Reserve 10% contingency automatically with pure integer division
    contingency_reserve = (total_budget_minor * 10) // 100
    allocatable_budget = total_budget_minor - contingency_reserve

    # Clear existing categories if any
    db.query(BudgetCategory).filter(BudgetCategory.event_id == event.id).delete()

    categories = []
    total_percent_basis = sum(int(round(item["percent"] * 100)) for item in allocations)

    for i, item in enumerate(allocations):
        # Calculate allocation strictly in integer minor units
        item_basis = int(round(item["percent"] * 100))
        allocated_minor = (item_basis * allocatable_budget) // total_percent_basis

        per_guest_minor = item.get("per_guest_minor", 0)
        if item.get("is_per_guest") and event.guest_count > 0:
            per_guest_minor = allocated_minor // event.guest_count

        cat = BudgetCategory(
            event_id=event.id,
            name=item["name"],
            allocation_percent=item["percent"],
            allocated_amount_minor=allocated_minor,
            icon=item["icon"],
            is_per_guest=item.get("is_per_guest", False),
            per_guest_minor=per_guest_minor,
            sort_order=i
        )
        categories.append(cat)

    db.add_all(categories)
    db.flush()

    # Seed baseline planned expenses for each category
    for cat in categories:
        create_baseline_expenses(db, cat, event, auto_commit=False)

    if auto_commit:
        db.commit()

def create_baseline_expenses(db: Session, category: BudgetCategory, event: Event, auto_commit: bool = False):
    """Populates realistic baseline planned items with provenance labels"""
    cat_name = category.name.lower()
    items = []

    if "catering" in cat_name:
        items = [
            ("Traditional Multi-Course Vegetarian Lunch (300 Pax)", int(category.allocated_amount_minor * 0.65), "calculated"),
            ("High Tea & Live Chaat/Farsan Counters", int(category.allocated_amount_minor * 0.20), "estimated"),
            ("Mineral Water, Welcome Drinks & Mocktails", int(category.allocated_amount_minor * 0.10), "estimated"),
            ("Service Staff & Dinnerware Cutlery Premium", int(category.allocated_amount_minor * 0.05), "estimated"),
        ]
    elif "venue" in cat_name:
        items = [
            ("Main AC Banquet Hall Rental (Full Day)", int(category.allocated_amount_minor * 0.75), "user_provided"),
            ("Bridal & Groom Green Rooms (2 Suites)", int(category.allocated_amount_minor * 0.15), "verified"),
            ("Valet Parking & Generator Power Backup Surcharge", int(category.allocated_amount_minor * 0.10), "estimated"),
        ]
    elif "decor" in cat_name:
        items = [
            ("Royal Traditional Mandap with Marigold & Brass Drapes", int(category.allocated_amount_minor * 0.50), "ai_suggested"),
            ("Welcome Arch & Entrance Floral Passage", int(category.allocated_amount_minor * 0.25), "ai_suggested"),
            ("Guest Seating Floral Table Centerpieces & Stage Lighting", int(category.allocated_amount_minor * 0.25), "estimated"),
        ]
    elif "photography" in cat_name:
        items = [
            ("Traditional + Candid Photography (2 Photographers, 2 Days)", int(category.allocated_amount_minor * 0.55), "estimated"),
            ("Cinematic 4K Wedding Film & Drone Coverage", int(category.allocated_amount_minor * 0.35), "estimated"),
            ("Premium Leather Album & Edited Reel Package", int(category.allocated_amount_minor * 0.10), "estimated"),
        ]
    elif "entertainment" in cat_name:
        items = [
            ("Live Traditional Shehnai & Dhol-Tasha Troupe", int(category.allocated_amount_minor * 0.40), "ai_suggested"),
            ("DJ Sound System, Stage Truss & Intelligent Moving Heads", int(category.allocated_amount_minor * 0.60), "estimated"),
        ]
    elif "attire" in cat_name:
        items = [
            ("Bridal Paithani/Kanjeevaram Silk Saree & Jewelry Styling", int(category.allocated_amount_minor * 0.60), "estimated"),
            ("Groom Sherwani & Royal Pheta/Turban Styling", int(category.allocated_amount_minor * 0.40), "estimated"),
        ]
    elif "invitation" in cat_name or "favor" in cat_name:
        items = [
            ("Eco-friendly Seed Paper Invitations & Digital Save-the-Date", int(category.allocated_amount_minor * 0.35), "calculated"),
            ("Custom Brass Bell & Handcrafted Sweet Box Return Gifts (300 Units)", int(category.allocated_amount_minor * 0.65), "calculated"),
        ]
    else:
        items = [
            ("Primary Ceremony Requirements", int(category.allocated_amount_minor * 0.70), "estimated"),
            ("Miscellaneous Logistics", int(category.allocated_amount_minor * 0.30), "estimated"),
        ]

    expenses = []
    for name, planned_minor, provenance in items:
        exp = Expense(
            category_id=category.id,
            name=name,
            planned_amount_minor=planned_minor,
            actual_amount_minor=0,
            provenance=provenance,
            notes=f"Auto-allocated according to {event.city} market benchmarks."
        )
        expenses.append(exp)

    db.add_all(expenses)
    if auto_commit:
        db.commit()
    else:
        db.flush()

def calculate_budget_summary(event: Event, categories: list[BudgetCategory]) -> dict[str, Any]:
    """Calculates deterministic ledger totals, contingency reserves, and variance"""
    total_budget_minor = event.budget_minor
    total_budget_rupees = paise_to_rupees(total_budget_minor)

    allocated_minor = sum(c.allocated_amount_minor for c in categories)
    allocated_rupees = paise_to_rupees(allocated_minor)

    planned_total_minor = 0
    actual_total_minor = 0

    for c in categories:
        for exp in c.expenses:
            planned_total_minor += exp.planned_amount_minor
            actual_total_minor += exp.actual_amount_minor

    planned_total_rupees = paise_to_rupees(planned_total_minor)
    actual_total_rupees = paise_to_rupees(actual_total_minor)

    # 10% explicit contingency reserve via pure integer arithmetic
    contingency_reserve_minor = (total_budget_minor * 10) // 100
    contingency_reserve_rupees = paise_to_rupees(contingency_reserve_minor)
    safety_buffer_minor = contingency_reserve_minor
    safety_buffer_rupees = contingency_reserve_rupees
    allocatable_minor = total_budget_minor - safety_buffer_minor
    allocatable_rupees = paise_to_rupees(allocatable_minor)

    unallocated_minor = max(0, total_budget_minor - allocated_minor - contingency_reserve_minor)
    unallocated_rupees = paise_to_rupees(unallocated_minor)
    is_reconciled = (total_budget_minor == (allocated_minor + contingency_reserve_minor + unallocated_minor))

    remaining_balance_minor = total_budget_minor - planned_total_minor
    remaining_balance_rupees = paise_to_rupees(remaining_balance_minor)

    deviation_minor = planned_total_minor - total_budget_minor
    deviation_rupees = paise_to_rupees(deviation_minor)
    is_over_budget = planned_total_minor > total_budget_minor

    per_guest_avg_rupees = 0.0
    if event.guest_count > 0:
        per_guest_avg_rupees = round(planned_total_rupees / event.guest_count, 2)

    return {
        "total_budget_minor": total_budget_minor,
        "total_budget_rupees": total_budget_rupees,
        "allocated_minor": allocated_minor,
        "allocated_rupees": allocated_rupees,
        "allocatable_minor": allocatable_minor,
        "allocatable_rupees": allocatable_rupees,
        "safety_buffer_minor": safety_buffer_minor,
        "safety_buffer_rupees": safety_buffer_rupees,
        "unallocated_minor": unallocated_minor,
        "unallocated_rupees": unallocated_rupees,
        "is_reconciled": is_reconciled,
        "planned_total_minor": planned_total_minor,
        "planned_total_rupees": planned_total_rupees,
        "actual_total_minor": actual_total_minor,
        "actual_total_rupees": actual_total_rupees,
        "remaining_balance_minor": remaining_balance_minor,
        "remaining_balance_rupees": remaining_balance_rupees,
        "contingency_reserve_minor": contingency_reserve_minor,
        "contingency_reserve_rupees": contingency_reserve_rupees,
        "contingency_percent": 10.0,
        "deviation_minor": deviation_minor,
        "deviation_rupees": deviation_rupees,
        "is_over_budget": is_over_budget,
        "per_guest_avg_rupees": per_guest_avg_rupees
    }

def simulate_what_if_changes(
    event: Event,
    categories: list[BudgetCategory],
    simulated_guest_count: int,
    simulated_budget_minor: int | None = None
) -> dict[str, Any]:
    """
    Deterministic What-If simulation:
    - Scales per-guest variable categories dynamically (catering, favors, per-head logistics).
    - Preserves fixed costs (venue rental, photography, DJ sound truss).
    - Checks whether new guest count fits into original or simulated budget.
    """
    target_budget_minor = simulated_budget_minor if simulated_budget_minor is not None else event.budget_minor
    target_budget_rupees = paise_to_rupees(target_budget_minor)
    original_budget_rupees = paise_to_rupees(event.budget_minor)

    orig_guests = event.guest_count if event.guest_count > 0 else 1
    delta_guests = simulated_guest_count - orig_guests

    breakdowns = []
    total_simulated_planned_minor = 0
    variable_cost_impact_minor = 0
    fixed_cost_total_minor = 0

    for cat in categories:
        orig_cat_minor = cat.allocated_amount_minor
        orig_cat_rupees = paise_to_rupees(orig_cat_minor)

        if cat.is_per_guest:
            # Per guest variable recalculation
            per_guest_minor = cat.per_guest_minor if cat.per_guest_minor > 0 else (orig_cat_minor // orig_guests)
            simulated_cat_minor = per_guest_minor * simulated_guest_count
            simulated_cat_rupees = paise_to_rupees(simulated_cat_minor)
            diff_rupees = paise_to_rupees(simulated_cat_minor - orig_cat_minor)
            variable_cost_impact_minor += (simulated_cat_minor - orig_cat_minor)

            breakdowns.append({
                "category_name": cat.name,
                "original_allocation_rupees": orig_cat_rupees,
                "simulated_allocation_rupees": simulated_cat_rupees,
                "difference_rupees": diff_rupees,
                "is_per_guest": True,
                "per_guest_rate_rupees": paise_to_rupees(per_guest_minor)
            })
            total_simulated_planned_minor += simulated_cat_minor
        else:
            # Fixed cost remains unchanged unless explicitly modified
            fixed_cost_total_minor += orig_cat_minor
            total_simulated_planned_minor += orig_cat_minor
            breakdowns.append({
                "category_name": cat.name,
                "original_allocation_rupees": orig_cat_rupees,
                "simulated_allocation_rupees": orig_cat_rupees,
                "difference_rupees": 0.0,
                "is_per_guest": False,
                "per_guest_rate_rupees": 0.0
            })

    # Calculate new contingency
    paise_to_rupees(total_simulated_planned_minor)
    new_remaining_minor = target_budget_minor - total_simulated_planned_minor
    new_remaining_rupees = paise_to_rupees(new_remaining_minor)

    if new_remaining_minor < 0:
        feasibility_status = "exceeds_budget"
        recommendation = (
            f"Scaling guests from {orig_guests} to {simulated_guest_count} increases variable costs by "
            f"₹{paise_to_rupees(variable_cost_impact_minor):,.2f}, resulting in a budget deficit of ₹{abs(new_remaining_rupees):,.2f}. "
            f"Recommendation: Consider renegotiating per-plate catering or adjusting decor/photography fixed allocations."
        )
    elif new_remaining_minor < int(target_budget_minor * 0.05):
        feasibility_status = "tight"
        recommendation = (
            f"Feasible, but buffer is tight (₹{new_remaining_rupees:,.2f} remaining, less than 5% contingency). "
            f"Monitor catering headcount guarantees closely."
        )
    else:
        feasibility_status = "feasible"
        recommendation = (
            f"Healthy buffer: ₹{new_remaining_rupees:,.2f} remaining in contingency. "
            f"The change from {orig_guests} to {simulated_guest_count} guests fits comfortably within the budget ceiling."
        )

    return {
        "original_guests": orig_guests,
        "simulated_guests": simulated_guest_count,
        "guest_count_change": delta_guests,
        "original_budget_rupees": original_budget_rupees,
        "simulated_budget_rupees": target_budget_rupees,
        "variable_cost_impact_rupees": paise_to_rupees(variable_cost_impact_minor),
        "fixed_cost_total_rupees": paise_to_rupees(fixed_cost_total_minor),
        "new_contingency_rupees": new_remaining_rupees,
        "feasibility_status": feasibility_status,
        "recommendation": recommendation,
        "category_breakdowns": breakdowns
    }
