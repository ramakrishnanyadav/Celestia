import re
from typing import Any

from sqlalchemy.orm import Session

from ..models import ActivityLog, Approval, Event, EventPlan
from ..schemas import ExtractedRequirement
from .budget_intelligence import (
    paise_to_rupees,
    rupees_to_paise,
    seed_event_budget,
    simulate_what_if_changes,
)
from .celebration_intelligence import generate_personalized_ideas
from .planning_intelligence import seed_event_tasks
from .vendor_intelligence import seed_sample_vendors_and_quotations


def _detect_event_type(text: str) -> str:
    if "birthday" in text or "bday" in text:
        return "birthday"
    if "community" in text or "festival" in text or "society" in text or "gathering" in text:
        return "community"
    return "wedding"

def _extract_guest_count(text: str) -> int:
    guest_match = re.search(r'\b(\d+)\s*(?:guests?|people|pax|attendees)\b', text, re.IGNORECASE)
    if guest_match:
        return max(10, min(5000, int(guest_match.group(1))))
    return 300

def _extract_budget_rupees(text: str) -> float:
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l)\b', text, re.IGNORECASE)
    if lakh_match:
        return float(lakh_match.group(1)) * 100000.0
    raw_num_match = re.search(r'(?:₹|rs\.?|inr)\s*([\d,]+)', text)
    if raw_num_match:
        clean_num = raw_num_match.group(1).replace(',', '')
        return float(clean_num)
    return 1500000.0

def _detect_city(text: str) -> str:
    city_map = {
        "mumbai": "Mumbai", "pune": "Pune", "delhi": "Delhi",
        "bengaluru": "Bengaluru", "bangalore": "Bengaluru",
        "hyderabad": "Hyderabad", "chennai": "Chennai",
        "kolkata": "Kolkata", "jaipur": "Jaipur", "ahmedabad": "Ahmedabad"
    }
    for c, formatted in city_map.items():
        if c in text:
            return formatted
    return "Mumbai"

def _detect_dietary(text: str) -> str:
    if "jain" in text:
        return "Strict Jain Vegetarian (No Root Veggies)"
    if "non-veg" in text or "chicken" in text or "mutton" in text:
        return "Multi-Cuisine Non-Vegetarian & Vegetarian"
    return "Pure Vegetarian"

def _detect_culture_and_traditions(text: str) -> tuple[str, list[str]]:
    if "gujarati" in text:
        return "Gujarati Traditional", ["Chandlo Matli", "Gol Dhana", "Garba / Dandiya Night", "Mameru", "Hasta Melap"]
    if "south indian" in text or "tamil" in text or "kannada" in text or "telugu" in text:
        return "South Indian Traditional", ["Nichayathartham", "Kashi Yatra", "Oonjal (Swing Ritual)", "Kanyadaanam", "Muhurtham"]
    if "punjabi" in text or "sikh" in text:
        return "Punjabi Traditional", ["Roka", "Chooda & Kaleere", "Jaggo Night", "Anand Karaj / Phere", "Bhangra Reception"]
    return "Maharashtrian Traditional", ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"]

def _detect_theme(text: str) -> str:
    if "pastel" in text or "minimalist" in text:
        return "Minimalist Pastel Flora & Cascading Mogra"
    if "temple" in text or "peshwai" in text:
        return "Peshwai Temple Grandeur"
    return "Royal Marigold & Polished Brass"


class AIService:
    @staticmethod
    def extract_requirements_from_text(prompt: str) -> ExtractedRequirement:
        """
        Extracts structured parameters from natural language event prompts.
        Uses sophisticated domain heuristics to extract guests, budget, cultural nuances, and city.
        """
        text = prompt.lower()
        event_type = _detect_event_type(text)
        guest_count = _extract_guest_count(text)
        budget_rupees = _extract_budget_rupees(text)
        city = _detect_city(text)
        dietary = _detect_dietary(text)
        regional_culture, traditions = _detect_culture_and_traditions(text)
        theme = _detect_theme(text)

        title = f"{regional_culture.split()[0]} {event_type.capitalize()} Celebration in {city}"
        if event_type == "wedding":
            title = f"Traditional {regional_culture.split()[0]} Wedding in {city}"

        return ExtractedRequirement(
            event_type=event_type,
            title=title,
            city=city,
            venue_type="Banquet Hall",
            guest_count=guest_count,
            budget_rupees=budget_rupees,
            dietary=dietary,
            theme=theme,
            regional_culture=regional_culture,
            cultural_traditions=traditions,
            preparation_months=6,
            special_requirements="Wheelchair accessibility for elderly guests, live traditional counters, zero plastic policy.",
            provenance="ai_suggested"
        )

    @staticmethod
    def generate_full_event_plan(db: Session, event: Event) -> dict[str, Any]:
        """
        Coordinates the entire planning generation:
        1. Seeds deterministic budget categories and expense baselines.
        2. Seeds timeline tasks with dependencies and runs Critical Path Method (CPM).
        3. Seeds sample vendors and quotations for immediate side-by-side comparison.
        4. Compiles structured blueprint JSON.
        """
        # 1. Budget
        seed_event_budget(db, event)
        # 2. Tasks & CPM
        seed_event_tasks(db, event)
        # 3. Vendors & Quotations
        seed_sample_vendors_and_quotations(db, event)

        # 4. Create master event plan
        pref = event.preference
        ideas = generate_personalized_ideas(event, pref)

        blueprint_json = {
            "version": 1,
            "architecture": "CELESTIA Structured Event Blueprint V2",
            "executive_summary": (
                f"Master execution plan for {event.title} in {event.city}. "
                f"Configured for {event.guest_count} guests with an approved budget ceiling of "
                f"₹{paise_to_rupees(event.budget_minor):,.2f}. Incorporating {pref.dietary if pref else 'Vegetarian'} catering "
                f"and {pref.theme if pref else 'Royal Marigold'} aesthetic."
            ),
            "pillars": {
                "celebration_intelligence": ideas,
                "financial_guardrails": {
                    "total_budget_rupees": paise_to_rupees(event.budget_minor),
                    "contingency_reserve_percent": 10.0,
                    "target_per_guest_avg": round(paise_to_rupees(event.budget_minor) / (event.guest_count or 1), 2)
                },
                "logistics": {
                    "preparation_window_months": event.preparation_months,
                    "city": event.city,
                    "venue_tier": event.venue_type
                }
            }
        }

        # Archive any previous active plans
        db.query(EventPlan).filter(
            EventPlan.event_id == event.id,
            EventPlan.status == "active"
        ).update({"status": "archived"})

        plan = EventPlan(
            event_id=event.id,
            version=1,
            title="Master Event Blueprint",
            summary=blueprint_json["executive_summary"],
            blueprint_json=blueprint_json,
            status="active"
        )
        db.add(plan)

        # Log activity
        log = ActivityLog(
            event_id=event.id,
            actor="AI",
            action="Plan Initialized",
            details=f"Generated structured blueprint with {event.guest_count} guests and ₹{paise_to_rupees(event.budget_minor):,.2f} budget."
        )
        db.add(log)
        db.commit()
        db.refresh(plan)

        return {
            "event_id": event.id,
            "plan_title": plan.title,
            "summary": plan.summary,
            "blueprint_json": plan.blueprint_json,
            "budget_allocation_summary": {
                "total_budget_rupees": paise_to_rupees(event.budget_minor),
                "guest_count": event.guest_count
            },
            "task_count": 21,
            "milestone_count": 7
        }

    @staticmethod
    def process_natural_language_command(
        db: Session,
        event: Event,
        command_text: str
    ) -> dict[str, Any]:
        """
        Processes natural language instructions through CELESTIA's 3-stage autonomy model:
        Level 1: Suggest (Informational response)
        Level 2: Draft (Generates a formal proposal with visual diff into approvals table)
        Level 3: Approve (Executed when user clicks approve on proposal)
        """
        if event.ai_paused:
            return {
                "autonomy_level": "Suggest",
                "message": "AI assistant is currently PAUSED. Unpause AI in Settings to permit automated planning updates.",
                "proposal_created": False
            }

        cmd = command_text.lower()

        # Check for guest count change intent: e.g. "Increase guest count to 350"
        guest_match = re.search(r'guests?(?:\s+count)?(?:\s+(?:to|by))?\s+(\d+)', cmd)
        if guest_match:
            new_guests = int(guest_match.group(1))
            sim_res = simulate_what_if_changes(event, event.budget_categories, new_guests)

            # Autonomy check:
            if event.autonomy_mode == "Suggest":
                return {
                    "autonomy_level": "Suggest",
                    "message": f"Simulation analysis: Scaling to {new_guests} guests impacts variable catering/favors by ₹{sim_res['variable_cost_impact_rupees']:,.2f}. Status: {sim_res['feasibility_status']}. (Suggest mode active; no draft created).",
                    "simulation": sim_res,
                    "proposal_created": False
                }
            else:
                # Draft mode: create proposal
                diff = {
                    "type": "guest_scaling",
                    "before": {"guest_count": event.guest_count},
                    "after": {"guest_count": new_guests},
                    "impact": {
                        "variable_cost_diff_rupees": sim_res["variable_cost_impact_rupees"],
                        "feasibility": sim_res["feasibility_status"],
                        "new_contingency_rupees": sim_res["new_contingency_rupees"]
                    }
                }
                proposal = Approval(
                    event_id=event.id,
                    proposal_type="guest_scaling",
                    title=f"Update Guest Count: {event.guest_count} → {new_guests} Pax",
                    summary=f"Recalculates per-head catering and favors with a net cost impact of ₹{sim_res['variable_cost_impact_rupees']:,.2f}.",
                    diff_summary=diff,
                    proposed_changes_json={"new_guest_count": new_guests},
                    status="pending"
                )
                db.add(proposal)

                log = ActivityLog(
                    event_id=event.id,
                    actor="AI",
                    action="Draft Proposal Created",
                    details=f"Drafted guest scale proposal ({event.guest_count} → {new_guests}). Awaiting host approval."
                )
                db.add(log)
                db.commit()
                db.refresh(proposal)

                return {
                    "autonomy_level": "Draft",
                    "message": f"I have prepared a draft proposal to adjust guest count from {event.guest_count} to {new_guests}. Please review the cost impact diff in the Approvals tab to approve or reject.",
                    "proposal_id": proposal.id,
                    "proposal_created": True,
                    "diff": diff
                }

        # Check for budget change intent: e.g. "Adjust budget to 18 lakhs"
        lakh_match = re.search(r'budget\b.*?(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b', cmd)
        if lakh_match:
            new_budget_rupees = float(lakh_match.group(1)) * 100000.0
            new_budget_minor = rupees_to_paise(new_budget_rupees)

            diff = {
                "type": "budget_adjustment",
                "before": {"budget_rupees": paise_to_rupees(event.budget_minor)},
                "after": {"budget_rupees": new_budget_rupees},
                "impact": {"delta_rupees": new_budget_rupees - paise_to_rupees(event.budget_minor)}
            }

            proposal = Approval(
                event_id=event.id,
                proposal_type="budget_adjustment",
                title=f"Adjust Total Budget: ₹{paise_to_rupees(event.budget_minor):,.2f} → ₹{new_budget_rupees:,.2f}",
                summary=f"Rebalances baseline category caps and contingency reserves to match ₹{new_budget_rupees:,.2f}.",
                diff_summary=diff,
                proposed_changes_json={"new_budget_minor": new_budget_minor},
                status="pending"
            )
            db.add(proposal)
            db.commit()
            db.refresh(proposal)

            return {
                "autonomy_level": "Draft",
                "message": f"Drafted budget adjustment to ₹{new_budget_rupees:,.2f}. Please review and approve in the Approvals queue.",
                "proposal_id": proposal.id,
                "proposal_created": True,
                "diff": diff
            }

        # General celebration query
        return {
            "autonomy_level": "Suggest",
            "message": (
                f"CELESTIA Planning Engine is tracking {event.title}. "
                f"Guest count: {event.guest_count}, Budget: ₹{paise_to_rupees(event.budget_minor):,.2f}. "
                f"You can ask me to simulate guest adjustments, compare vendor quotes, or customize traditions."
            ),
            "proposal_created": False
        }
