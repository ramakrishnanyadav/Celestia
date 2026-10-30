from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- PREFERENCE SCHEMAS ---
class EventPreferenceBase(BaseModel):
    dietary: str = "Pure Vegetarian"
    theme: str = "Royal Marigold & Polished Brass"
    regional_culture: str = "Maharashtrian Traditional"
    cultural_traditions: List[str] = Field(default_factory=lambda: ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"])
    music_entertainment: str = "Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ"
    color_palette: List[str] = Field(default_factory=lambda: ["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"])
    special_requirements: Optional[str] = "Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts."

class EventPreferenceCreate(EventPreferenceBase):
    pass

class EventPreferenceResponse(EventPreferenceBase):
    id: str
    event_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- EVENT SCHEMAS ---
class EventCreate(BaseModel):
    title: str = "Anjali & Rahul's Royal Mumbai Wedding"
    event_type: str = "wedding" # wedding, birthday, community
    city: str = "Mumbai"
    venue_type: str = "Banquet Hall"
    guest_count: int = 300
    budget_minor: int = 150000000 # 15,00,000 INR in paise
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    preparation_months: int = 6
    target_date: Optional[datetime] = None
    autonomy_mode: str = "Draft" # Suggest, Draft, Approve
    preferences: Optional[EventPreferenceBase] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    city: Optional[str] = None
    venue_type: Optional[str] = None
    guest_count: Optional[int] = None
    budget_minor: Optional[int] = None
    target_date: Optional[datetime] = None
    preparation_months: Optional[int] = None
    status: Optional[str] = None
    autonomy_mode: Optional[str] = None
    ai_paused: Optional[bool] = None

class EventResponse(BaseModel):
    id: str
    user_id: str
    title: str
    event_type: str
    city: str
    venue_type: str
    guest_count: int
    budget_minor: int
    budget_rupees: Optional[float] = None
    currency: str
    timezone: str
    preparation_months: int
    status: str
    autonomy_mode: str
    ai_paused: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE & BUDGET SCHEMAS ---
class ExpenseCreate(BaseModel):
    name: str
    planned_amount_minor: int
    actual_amount_minor: int = 0
    provenance: str = "estimated"
    notes: Optional[str] = None

class ExpenseUpdate(BaseModel):
    name: Optional[str] = None
    planned_amount_minor: Optional[int] = None
    actual_amount_minor: Optional[int] = None
    provenance: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    category_id: str
    name: str
    planned_amount_minor: int
    planned_rupees: Optional[float] = None
    actual_amount_minor: int
    actual_rupees: Optional[float] = None
    provenance: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BudgetCategoryCreate(BaseModel):
    name: str
    allocation_percent: float
    allocated_amount_minor: int
    icon: str = "DollarSign"
    is_per_guest: bool = False
    per_guest_minor: int = 0
    sort_order: int = 0

class BudgetCategoryResponse(BaseModel):
    id: str
    event_id: str
    name: str
    allocation_percent: float
    allocated_amount_minor: int
    allocated_rupees: Optional[float] = None
    icon: str
    is_per_guest: bool
    per_guest_minor: int
    per_guest_rupees: Optional[float] = None
    sort_order: int
    expenses: List[ExpenseResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class BudgetSummaryResponse(BaseModel):
    total_budget_minor: int
    total_budget_rupees: float
    allocated_minor: int
    allocated_rupees: float
    planned_total_minor: int
    planned_total_rupees: float
    actual_total_minor: int
    actual_total_rupees: float
    remaining_balance_minor: int
    remaining_balance_rupees: float
    contingency_reserve_minor: int
    contingency_reserve_rupees: float
    contingency_percent: float
    deviation_minor: int
    deviation_rupees: float
    is_over_budget: bool
    per_guest_avg_rupees: float
    categories: List[BudgetCategoryResponse]

class WhatIfSimulationRequest(BaseModel):
    simulated_guest_count: int
    simulated_budget_minor: Optional[int] = None

class WhatIfCategoryChange(BaseModel):
    category_name: str
    original_allocation_rupees: float
    simulated_allocation_rupees: float
    difference_rupees: float
    is_per_guest: bool
    per_guest_rate_rupees: float

class WhatIfSimulationResponse(BaseModel):
    original_guests: int
    simulated_guests: int
    guest_count_change: int
    original_budget_rupees: float
    simulated_budget_rupees: float
    variable_cost_impact_rupees: float
    fixed_cost_total_rupees: float
    new_contingency_rupees: float
    feasibility_status: str # "feasible", "tight", "exceeds_budget"
    recommendation: str
    category_breakdowns: List[WhatIfCategoryChange]

# --- TASK & TIMELINE SCHEMAS ---
class TaskDependencyItem(BaseModel):
    task_id: str
    depends_on_task_id: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "General"
    milestone_name: str = "6 Months Out"
    days_before_event: int = 180
    duration_days: int = 7
    priority: str = "medium"
    assigned_to: str = "Host"
    depends_on_ids: List[str] = Field(default_factory=list)

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    milestone_name: Optional[str] = None
    days_before_event: Optional[int] = None
    duration_days: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    is_critical: Optional[bool] = None

class TaskResponse(BaseModel):
    id: str
    event_id: str
    title: str
    description: Optional[str] = None
    category: str
    milestone_name: str
    days_before_event: int
    duration_days: int
    priority: str
    status: str
    assigned_to: str
    is_critical: bool
    early_start_day: int
    early_finish_day: int
    late_start_day: int
    late_finish_day: int
    total_slack: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    depends_on_ids: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class CPMResultResponse(BaseModel):
    total_duration_days: int
    critical_path_task_ids: List[str]
    tasks: List[TaskResponse]

# --- VENDOR & QUOTATION SCHEMAS ---
class QuotationCreate(BaseModel):
    vendor_id: str
    quoted_amount_minor: int
    status: str = "received"
    file_url: Optional[str] = None
    inclusions: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    terms: Dict[str, Any] = Field(default_factory=dict)
    detected_risks: List[str] = Field(default_factory=list)
    is_sample: bool = False

class QuotationResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name_cached: Optional[str] = None
    quoted_amount_minor: int
    quoted_rupees: Optional[float] = None
    status: str
    file_url: Optional[str] = None
    inclusions: List[str]
    exclusions: List[str]
    terms: Dict[str, Any]
    detected_risks: List[str]
    is_sample: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorCreate(BaseModel):
    category: str
    name: str
    contact: Optional[str] = None
    rating: float = 4.5
    notes: Optional[str] = None

class VendorResponse(BaseModel):
    id: str
    event_id: str
    category: str
    name: str
    contact: Optional[str] = None
    status: str
    rating: float
    notes: Optional[str] = None
    quotations: List[QuotationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class QuotationComparisonItem(BaseModel):
    quotation_id: str
    vendor_id: str
    vendor_name: str
    category: str
    quoted_rupees: float
    advance_payment_percent: float
    cancellation_terms: str
    included_services_count: int
    inclusions: List[str]
    exclusions: List[str]
    detected_risks: List[str]
    risk_score: str # Low, Medium, High
    is_recommended: bool

class VendorComparisonResponse(BaseModel):
    category: str
    recommended_quotation_id: Optional[str] = None
    missing_inclusions_warning: List[str] = Field(default_factory=list)
    comparison_items: List[QuotationComparisonItem] = Field(default_factory=list)

# --- APPROVAL & AUTONOMY SCHEMAS ---
class ApprovalCreate(BaseModel):
    proposal_type: str
    title: str
    summary: str
    diff_summary: Dict[str, Any]
    proposed_changes_json: Dict[str, Any]

class ApprovalAction(BaseModel):
    action: str # "approve" or "reject"
    comment: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    event_id: str
    proposal_type: str
    title: str
    summary: str
    diff_summary: Dict[str, Any]
    proposed_changes_json: Dict[str, Any]
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- ACTIVITY LOG SCHEMAS ---
class ActivityLogResponse(BaseModel):
    id: str
    event_id: str
    actor: str
    action: str
    details: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- AI & CELEBRATION INTELLIGENCE SCHEMAS ---
class RequirementExtractionRequest(BaseModel):
    natural_language_prompt: str

class ExtractedRequirement(BaseModel):
    event_type: str = "wedding"
    title: str
    city: str = "Mumbai"
    venue_type: str = "Banquet Hall"
    guest_count: int = 300
    budget_rupees: float = 1500000.0
    dietary: str = "Pure Vegetarian"
    theme: str = "Royal Marigold & Polished Brass"
    regional_culture: str = "Maharashtrian Traditional"
    cultural_traditions: List[str] = Field(default_factory=list)
    preparation_months: int = 6
    special_requirements: str = ""
    provenance: str = "ai_suggested"

class PersonalizedIdeasResponse(BaseModel):
    themes: List[Dict[str, Any]]
    decor_concepts: List[Dict[str, Any]]
    food_and_menu: List[Dict[str, Any]]
    entertainment: List[Dict[str, Any]]
    return_gifts: List[Dict[str, Any]]
    cultural_traditions: List[Dict[str, Any]]
    budget_conscious_alternatives: List[Dict[str, Any]]

class PlanGenerationResponse(BaseModel):
    event_id: str
    plan_title: str
    summary: str
    blueprint_json: Dict[str, Any]
    budget_allocation_summary: Dict[str, Any]
    task_count: int
    milestone_count: int
