import re
import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from ..models import Event, EventPreference, EventPlan, Approval, ActivityLog
from ..schemas import ExtractedRequirement, WhatIfSimulationRequest
from .budget_intelligence import rupees_to_paise, paise_to_rupees, seed_event_budget, simulate_what_if_changes
from .planning_intelligence import seed_event_tasks, run_cpm_calculation
from .vendor_intelligence import seed_sample_vendors_and_quotations
from .celebration_intelligence import generate_personalized_ideas

class AIService:
    @staticmethod
    def extract_requirements_from_text(prompt: str) -> ExtractedRequirement:
        """
        Extracts structured parameters from natural language event prompts.
        Uses sophisticated domain heuristics to extract guests, budget, cultural nuances, and city.
        """
        text = prompt.lower()
        
        # Determine event type
        event_type = "wedding"
        if "birthday" in text or "bday" in text:
            event_type = "birthday"
        elif "community" in text or "festival" in text or "society" in text or "gathering" in text:
            event_type = "community"
            
        # Extract guest count
        guest_count = 300 # Default
        guest_match = re.search(r'(\d+)\s*(?:guests?|people|pax|attendees)', text)
        if guest_match:
            guest_count = int(guest_match.group(1))
            
        # Extract budget
        budget_rupees = 1500000.0 # Default ₹15,00,000
        # Check for Lakhs / L / Cr / Rupees patterns
        lakh_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b)', text)
        if lakh_match:
            budget_rupees = float(lakh_match.group(1)) * 100000.0
        else:
            raw_num_match = re.search(r'(?:₹|rs\.?|inr)\s*([\d,]+)', text)
            if raw_num_match:
                clean_num = raw_num_match.group(1).replace(',', '')
                budget_rupees = float(clean_num)
                
        # City detection
        city = "Mumbai"
        for c in ["mumbai", "pune", "delhi", "bengaluru", "bangalore", "hyderabad", "chennai", "kolkata", "jaipur", "ahmedabad"]:
            if c in text:
                city = c.capitalize()
                if city == "Bangalore":
                    city = "Bengaluru"
                break
                
        # Dietary preferences
        dietary = "Pure Vegetarian"
        if "jain" in text:
            dietary = "Strict Jain Vegetarian (No Root Veggies)"
        elif "non-veg" in text or "chicken" in text or "mutton" in text:
            dietary = "Multi-Cuisine Non-Vegetarian & Vegetarian"
            
        # Regional cultural traditions
        regional_culture = "Maharashtrian Traditional"
        traditions = ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"]
        
        if "gujarati" in text:
            regional_culture = "Gujarati Traditional"
            traditions = ["Chandlo Matli", "Gol Dhana", "Garba / Dandiya Night", "Mameru", "Hasta Melap"]
        elif "south indian" in text or "tamil" in text or "kannada" in text or "telugu" in text:
            regional_culture = "South Indian Traditional"
            traditions = ["Nichayathartham", "Kashi Yatra", "Oonjal (Swing Ritual)", "Kanyadaanam", "Muhurtham"]
        elif "punjabi" in text or "sikh" in text:
            regional_culture = "Punjabi Traditional"
            traditions = ["Roka", "Chooda & Kaleere", "Jaggo Night", "Anand Karaj / Phere", "Bhangra Reception"]
            
        # Themes
        theme = "Royal Marigold & Polished Brass"
        if "pastel" in text or "minimalist" in text:
            theme = "Minimalist Pastel Flora & Cascading Mogra"
        elif "temple" in text or "peshwai" in text:
            theme = "Peshwai Temple Grandeur"
            
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
    def generate_full_event_plan(db: Session, event: Event) -> Dict[str, Any]:
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
    ) -> Dict[str, Any]:
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
        guest_match = re.search(r'(?:increase|decrease|change|scale|set)?\s*guests?\s*(?:count)?\s*(?:to|by)?\s*(\d+)', cmd)
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
        lakh_match = re.search(r'(?:adjust|change|increase|decrease|set)?\s*budget\s*(?:to)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b)', cmd)
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
