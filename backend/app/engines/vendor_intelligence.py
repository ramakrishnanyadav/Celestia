from typing import Any

from sqlalchemy.orm import Session

from ..models import Event, Quotation, Vendor
from .budget_intelligence import paise_to_rupees


def seed_sample_vendors_and_quotations(db: Session, event: Event, auto_commit: bool = False):
    """
    Populates realistic vendor requirements and competing quotations
    for Catering, Venue, Decor, and Photography so the user can immediately
    experience side-by-side comparison, inclusion checks, and risk analysis.
    """
    # Clear existing vendors for clean seed
    db.query(Vendor).filter(Vendor.event_id == event.id).delete()

    # 1. CATERING VENDORS (2 competing quotes)
    v_cater1 = Vendor(
        event_id=event.id,
        category="Catering",
        name="Shree Ganesh Gourmet Caterers",
        contact="+91 98201 12345 (Dadar, Mumbai)",
        status="comparing",
        rating=4.8,
        notes="Specialists in authentic Maharashtrian & Gujarati pure vegetarian banquets."
    )
    v_cater2 = Vendor(
        event_id=event.id,
        category="Catering",
        name="Royal Rasoi Banqueting",
        contact="+91 98330 54321 (Andheri West, Mumbai)",
        status="comparing",
        rating=4.5,
        notes="Modern fusion catering with live interactive counters."
    )
    db.add_all([v_cater1, v_cater2])
    db.flush()

    # Quotations for Caterer 1
    q1 = Quotation(
        vendor_id=v_cater1.id,
        vendor_name_cached=v_cater1.name,
        quoted_amount_minor=51000000, # ₹5,10,000 for 300 pax (~₹1,700/plate)
        status="reviewing",
        is_sample=True,
        inclusions=[
            "Full 5-course Pure Vegetarian Lunch Feast for 300 guests",
            "Unlimited steamed Ukadiche Modak with pure desi ghee",
            "Welcome Drinks (Kokum Sherbet, Solkadhi shooters)",
            "High Tea & Live Chaat Counter (Pani Puri, Sev Puri, Dahi Vada)",
            "Uniformed service staff (1 waiter per 15 guests)",
            "Premium bone china dinnerware & copper cutlery setup",
            "Mineral water bottles and drinking ice supply included"
        ],
        exclusions=[
            "Pre-wedding Haldi morning snacks",
            "Midnight supper pack"
        ],
        terms={
            "advance_percent": 30.0,
            "balance_due_days_before": 2,
            "cancellation_policy": "Full refund up to 30 days prior; 80% refund up to 14 days prior.",
            "overtime_policy": "No overtime charges up to 1 hour grace period."
        },
        detected_risks=[
            "Minor risk: Final guest count lock required 7 days prior; minimum billing is 280 guests."
        ]
    )

    # Quotations for Caterer 2
    q2 = Quotation(
        vendor_id=v_cater2.id,
        vendor_name_cached=v_cater2.name,
        quoted_amount_minor=55500000, # ₹5,55,000 for 300 pax (~₹1,850/plate)
        status="reviewing",
        is_sample=True,
        inclusions=[
            "Pure Vegetarian Lunch Feast for 300 guests",
            "Live Pasta & Mexican Counter along with Indian menu",
            "Welcome Mocktails fountain",
            "Basic melamine crockery and stainless steel cutlery",
            "Service staff"
        ],
        exclusions=[
            "Traditional Ukadiche Modak (charged ₹60/piece extra)",
            "Mineral water jars & dispenser bottles (client must supply)",
            "High tea snacks (billed separately at ₹250/plate)",
            "Kitchen post-event garbage disposal surcharge (₹5,000 extra)"
        ],
        terms={
            "advance_percent": 60.0,
            "balance_due_days_before": 10,
            "cancellation_policy": "Strict non-refundable deposit under all conditions.",
            "overtime_policy": "₹15,000 per hour after 4:00 PM."
        },
        detected_risks=[
            "High Advance Risk: 60% advance required immediately upon booking.",
            "Hidden Fee Risk: Drinking water, garbage disposal, and traditional sweets excluded.",
            "High Overtime Penalty: Strict ₹15,000/hr surcharge if ceremony runs late.",
            "Strict Non-refundable Policy: 0% refund on cancellation."
        ]
    )

    # 2. DECOR VENDORS (2 competing quotes)
    v_decor1 = Vendor(
        event_id=event.id,
        category="Decor",
        name="Utsav Mandap Creations",
        contact="+91 98190 88776 (Vile Parle, Mumbai)",
        status="comparing",
        rating=4.9,
        notes="Award-winning marigold and traditional brass setup designers."
    )
    v_decor2 = Vendor(
        event_id=event.id,
        category="Decor",
        name="Elite Floral Events",
        contact="+91 98200 99887 (Bandra, Mumbai)",
        status="comparing",
        rating=4.3,
        notes="Contemporary floral backdrops and LED stage setups."
    )
    db.add_all([v_decor1, v_decor2])
    db.commit()
    db.refresh(v_decor1)
    db.refresh(v_decor2)

    q_dec1 = Quotation(
        vendor_id=v_decor1.id,
        vendor_name_cached=v_decor1.name,
        quoted_amount_minor=23000000, # ₹2,30,000
        status="reviewing",
        is_sample=True,
        inclusions=[
            "Royal 4-pillar open Mandap with 100% fresh yellow/orange marigolds & brass bells",
            "Grand entrance toran arch with tuberoses and 6 antique brass urlis",
            "Stage background with warm amber LED wash & brass samai lamps",
            "Floral rangoli at foyer & dining area",
            "Mandap havan kund setup with copper vessels",
            "Setup completion 4 hours before ceremony start"
        ],
        exclusions=[
            "Outdoor fireworks or cold pyros"
        ],
        terms={
            "advance_percent": 25.0,
            "balance_due_days_before": 1,
            "cancellation_policy": "50% refund if cancelled 20 days prior.",
            "overtime_policy": "Free teardown window until midnight."
        },
        detected_risks=[
            "Flower price volatility note: Marigold prices subject to Dadar market festival spike if date aligns with Diwali."
        ]
    )

    q_dec2 = Quotation(
        vendor_id=v_decor2.id,
        vendor_name_cached=v_decor2.name,
        quoted_amount_minor=27500000, # ₹2,75,000
        status="reviewing",
        is_sample=True,
        inclusions=[
            "Synthetic & mixed artificial flower Mandap structure",
            "Fairy light tunnel entrance",
            "White sofa set for bride & groom on stage"
        ],
        exclusions=[
            "Fresh flowers for havan / mandap (charged at actuals)",
            "Generator fuel charges (billed at ₹3,000/hr)",
            "Labor teardown and municipal waste disposal charges"
        ],
        terms={
            "advance_percent": 50.0,
            "balance_due_days_before": 7,
            "cancellation_policy": "Non-refundable deposit.",
            "overtime_policy": "₹8,000 per hour."
        },
        detected_risks=[
            "Material Discrepancy: Uses artificial/synthetic flowers instead of fresh auspicious marigolds.",
            "Hidden Utility Charges: Generator fuel and municipal cleanup billed separately.",
            "High Advance: 50% non-refundable upfront payment."
        ]
    )

    db.add_all([q1, q2, q_dec1, q_dec2])
    if auto_commit:
        db.commit()
    else:
        db.flush()

def analyze_quotation_risks(terms: dict[str, Any], inclusions: list[str], exclusions: list[str]) -> list[str]:
    """Automated heuristic risk detection on vendor contractual clauses"""
    risks = []
    adv = terms.get("advance_percent", 0)
    if adv > 40.0:
        risks.append(f"High Advance Risk: Vendor demands {adv}% upfront deposit before services.")

    canc = str(terms.get("cancellation_policy", "")).lower()
    if "non-refundable" in canc or "no refund" in canc:
        risks.append("Strict Cancellation Penalty: Deposit is non-refundable in case of date postponement.")

    ot = str(terms.get("overtime_policy", "")).lower()
    if "per hour" in ot or "surcharge" in ot:
        risks.append(f"Overtime Fee Risk: Strict overtime clauses apply ({terms.get('overtime_policy')}).")

    # Check for crucial omissions in exclusions
    excl_str = " ".join(exclusions).lower()
    if "water" in excl_str:
        risks.append("Omission Warning: Basic drinking water is excluded from catering quotation.")
    if "waste" in excl_str or "garbage" in excl_str or "clean" in excl_str:
        risks.append("Hidden Operational Fee: Venue / kitchen trash disposal is excluded.")
    if "generator" in excl_str or "electricity" in excl_str:
        risks.append("Utility Risk: Backup generator or power load billed separately.")

    return risks

def compare_quotations_for_category(db: Session, event_id: str, category: str) -> dict[str, Any]:
    """Generates side-by-side comparison matrix with risk scoring and recommendation"""
    vendors = db.query(Vendor).filter(
        Vendor.event_id == event_id,
        Vendor.category.ilike(f"%{category}%")
    ).all()

    comparison_items = []
    all_inclusions_seen = set()

    for v in vendors:
        for q in v.quotations:
            q_rupees = paise_to_rupees(q.quoted_amount_minor)
            adv = q.terms.get("advance_percent", 30.0)
            canc = q.terms.get("cancellation_policy", "Standard")

            # Recalculate risks dynamically
            risks = analyze_quotation_risks(q.terms, q.inclusions, q.exclusions)
            # Merge with stored risks
            all_risks = list(set(risks + (q.detected_risks or [])))

            risk_score = "Low"
            if len(all_risks) >= 3:
                risk_score = "High"
            elif len(all_risks) >= 1:
                risk_score = "Medium"

            for inc in q.inclusions:
                all_inclusions_seen.add(inc)

            comparison_items.append({
                "quotation_id": q.id,
                "vendor_id": v.id,
                "vendor_name": v.name,
                "category": v.category,
                "quoted_rupees": q_rupees,
                "advance_payment_percent": adv,
                "cancellation_terms": canc,
                "included_services_count": len(q.inclusions),
                "inclusions": q.inclusions,
                "exclusions": q.exclusions,
                "detected_risks": all_risks,
                "risk_score": risk_score,
                "is_recommended": False
            })

    # Sort by value (balance of price and lowest risks)
    if comparison_items:
        # Sort key: risk penalty + price
        def score_quote(item):
            risk_penalty = 1000000 if item["risk_score"] == "High" else (300000 if item["risk_score"] == "Medium" else 0)
            return item["quoted_rupees"] + risk_penalty

        best = min(comparison_items, key=score_quote)
        best["is_recommended"] = True
        recommended_id = best["quotation_id"]
    else:
        recommended_id = None

    return {
        "category": category,
        "recommended_quotation_id": recommended_id,
        "missing_inclusions_warning": [
            "Verify whether local municipal noise permissions and police licenses are handled by vendor or host.",
            "Confirm backup generator diesel fuel billing policy."
        ],
        "comparison_items": comparison_items
    }
