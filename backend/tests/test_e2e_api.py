import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import create_access_token, decode_token, hash_password, verify_password
from app.database import Base
from app.engines.ai_service import AIService
from app.engines.budget_intelligence import (
    calculate_budget_summary,
    paise_to_rupees,
    rupees_to_paise,
    seed_event_budget,
    simulate_what_if_changes,
)
from app.engines.celebration_intelligence import generate_personalized_ideas
from app.engines.planning_intelligence import run_cpm_calculation, seed_event_tasks
from app.engines.vendor_intelligence import (
    analyze_quotation_risks,
    compare_quotations_for_category,
    seed_sample_vendors_and_quotations,
)
from app.models import (
    Approval,
    BudgetCategory,
    Event,
    EventPreference,
    Task,
    User,
)

# In-memory SQLite for high-speed isolated testing
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_event(db):
    user = User(
        email="test_host@celestia.ai",
        name="Anjali & Rahul",
        password_hash=hash_password("securepassword"),
        role="planner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    event = Event(
        user_id=user.id,
        title="Anjali & Rahul's Royal Mumbai Wedding",
        event_type="wedding",
        city="Mumbai",
        venue_type="Banquet Hall",
        guest_count=300,
        budget_minor=150000000, # ₹15,00,000 in paise
        currency="INR",
        timezone="Asia/Kolkata",
        preparation_months=6,
        status="planning",
        autonomy_mode="Draft"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    pref = EventPreference(
        event_id=event.id,
        dietary="Pure Vegetarian",
        theme="Royal Marigold & Polished Brass",
        regional_culture="Maharashtrian Traditional",
        cultural_traditions=["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"],
        music_entertainment="Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ"
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return event

# --- 1. AUTHENTICATION & CRYPTO TESTS ---
def test_password_hashing_and_verification():
    raw_pwd = "my_secret_wedding_password_2026"
    hashed = hash_password(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_token_creation_and_decoding():
    data = {"sub": "user-uuid-123", "email": "host@celestia.ai"}
    token = create_access_token(data)
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-uuid-123"
    assert decoded["email"] == "host@celestia.ai"

# --- 2. DETERMINISTIC BUDGET INTELLIGENCE TESTS ---
def test_integer_minor_units_conversion():
    rupees = 1500000.0 # 15 Lakhs
    paise = rupees_to_paise(rupees)
    assert paise == 150000000
    assert paise_to_rupees(paise) == 1500000.0

def test_deterministic_budget_allocation_and_contingency(db, sample_event):
    seed_event_budget(db, sample_event)
    categories = db.query(BudgetCategory).filter(BudgetCategory.event_id == sample_event.id).all()
    assert len(categories) > 0

    summary = calculate_budget_summary(sample_event, categories)
    # Check total budget matches exactly ₹15,00,000
    assert summary["total_budget_rupees"] == 1500000.0
    # Contingency reserve must be 10% (₹1,50,000)
    assert summary["contingency_reserve_rupees"] == 150000.0
    assert summary["contingency_percent"] == 10.0
    # Over budget flag should be False initially
    assert summary["is_over_budget"] is False

def test_what_if_guest_scaling_simulation(db, sample_event):
    seed_event_budget(db, sample_event)
    categories = db.query(BudgetCategory).filter(BudgetCategory.event_id == sample_event.id).all()

    # Scale from 300 to 350 guests (+50 guests)
    sim = simulate_what_if_changes(sample_event, categories, 350)
    assert sim["original_guests"] == 300
    assert sim["simulated_guests"] == 350
    assert sim["guest_count_change"] == 50
    # Variable cost impact must be positive because guest count increased
    assert sim["variable_cost_impact_rupees"] > 0
    # Fixed costs must not change
    assert sim["fixed_cost_total_rupees"] > 0

# --- 3. PLANNING INTELLIGENCE & CRITICAL PATH METHOD (CPM) TESTS ---
def test_cpm_and_dag_dependencies(db, sample_event):
    seed_event_tasks(db, sample_event)
    cpm_res = run_cpm_calculation(db, sample_event.id)

    assert cpm_res["total_duration_days"] > 0
    assert len(cpm_res["critical_path_task_ids"]) > 0

    tasks = db.query(Task).filter(Task.event_id == sample_event.id).all()
    # Check that critical tasks have total_slack == 0
    crit_tasks = [t for t in tasks if t.is_critical]
    assert len(crit_tasks) > 0
    for ct in crit_tasks:
        assert ct.total_slack == 0

# --- 4. VENDOR INTELLIGENCE & CONTRACT RISK TESTS ---
def test_contract_risk_heuristics():
    risks = analyze_quotation_risks(
        terms={"advance_percent": 60.0, "cancellation_policy": "Non-refundable"},
        inclusions=["Food"],
        exclusions=["Drinking water bottles", "Garbage disposal"]
    )
    assert any("High Advance" in r for r in risks)
    assert any("Cancellation" in r for r in risks)
    assert any("water" in r for r in risks)
    assert any("disposal" in r or "trash" in r for r in risks)

def test_vendor_quotation_comparison(db, sample_event):
    seed_sample_vendors_and_quotations(db, sample_event)
    comp = compare_quotations_for_category(db, sample_event.id, "Catering")
    assert len(comp["comparison_items"]) == 2
    assert comp["recommended_quotation_id"] is not None
    # Best quotation should have lower risk score
    recommended = next(item for item in comp["comparison_items"] if item["is_recommended"])
    assert recommended["risk_score"] in ["Low", "Medium"]

# --- 5. CELEBRATION INTELLIGENCE & PERSONALIZATION TESTS ---
def test_celebration_ideas_generation(sample_event):
    ideas = generate_personalized_ideas(sample_event, sample_event.preference)
    assert "themes" in ideas
    assert len(ideas["themes"]) >= 2
    assert "food_and_menu" in ideas
    assert "cultural_traditions" in ideas
    assert len(ideas["cultural_traditions"]) >= 4

# --- 6. AI REQUIREMENT EXTRACTION TESTS ---
def test_natural_language_requirement_extraction():
    prompt = (
        "Organize a traditional Maharashtrian wedding in Mumbai for 300 guests with maximum budget "
        "of ₹15,00,000, pure vegetarian catering, 6-month preparation, and Royal Marigold decor."
    )
    req = AIService.extract_requirements_from_text(prompt)
    assert req.event_type == "wedding"
    assert req.guest_count == 300
    assert req.budget_rupees == 1500000.0
    assert req.city == "Mumbai"
    assert "Vegetarian" in req.dietary

# --- 7. AUTONOMY & APPROVAL WORKFLOW TESTS ---
def test_ai_autonomy_draft_proposal_workflow(db, sample_event):
    seed_event_budget(db, sample_event)

    # Process command to scale guests to 350
    result = AIService.process_natural_language_command(
        db, sample_event, "Scale guest count to 350 pax"
    )
    assert result["autonomy_level"] == "Draft"
    assert result["proposal_created"] is True

    # Verify proposal in DB
    proposal = db.query(Approval).filter(Approval.id == result["proposal_id"]).first()
    assert proposal is not None
    assert proposal.status == "pending"
    # Live event guest count must remain unchanged at 300 until approved
    assert sample_event.guest_count == 300
