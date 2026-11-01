import html
import re
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


def sanitize_free_text(v: Any) -> Any:
    """Strips control chars and escapes HTML tags without breaking apostrophes."""
    if not isinstance(v, str):
        return v
    # Strip null bytes and non-printable control characters except newline and tab
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', v)
    return html.escape(cleaned.strip(), quote=False)

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: str = Field(..., max_length=255)
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=10, max_length=128)

    @field_validator("name", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class UserLogin(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=10, max_length=128)

class SessionResponse(BaseModel):
    id: str
    created_at: str | None = None
    expires_at: str | None = None
    is_current: bool = False

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    role: str
    is_demo: bool | None = False
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    refresh_token: str | None = None
    csrf_token: str | None = None

# --- PREFERENCE SCHEMAS ---
class EventPreferenceBase(BaseModel):
    dietary: str = Field("Pure Vegetarian", max_length=200)
    theme: str = Field("Royal Marigold & Polished Brass", max_length=200)
    regional_culture: str = Field("Maharashtrian Traditional", max_length=200)
    cultural_traditions: list[str] = Field(default_factory=lambda: ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"])
    music_entertainment: str = Field("Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ", max_length=500)
    color_palette: list[str] = Field(default_factory=lambda: ["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"])
    special_requirements: str | None = Field("Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts.", max_length=2000)

    @field_validator("dietary", "theme", "regional_culture", "music_entertainment", "special_requirements", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class EventPreferenceCreate(EventPreferenceBase):
    pass

class EventPreferenceResponse(EventPreferenceBase):
    id: str
    event_id: str
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at", mode="plain", check_fields=False)
    def serialize_datetime(self, dt: datetime | None) -> str | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
        return dt.isoformat()

    model_config = ConfigDict(from_attributes=True)

# --- EVENT SCHEMAS ---
class EventCreate(BaseModel):
    title: str = Field("Anjali & Rahul's Royal Mumbai Wedding", min_length=2, max_length=255)
    event_type: str = "wedding" # wedding, birthday, community
    city: str = Field("Mumbai", min_length=2, max_length=100)
    venue_type: str = Field("Banquet Hall", max_length=100)
    guest_count: int = Field(300, ge=10, le=5000)
    budget_minor: int = Field(150000000, ge=1000000, le=10000000000) # ₹10,000 to ₹10,00,00,000 in paise
    budget_rupees: float | None = Field(None, ge=10000.0, le=100000000.0)
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"
    preparation_months: int = Field(6, ge=1, le=36)
    target_date: datetime | None = None
    autonomy_mode: str = "Draft" # Suggest, Draft, Approve
    preferences: EventPreferenceBase | None = None

    @field_validator("title", "city", "venue_type", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class EventUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=255)
    event_type: str | None = None
    city: str | None = Field(None, min_length=2, max_length=100)
    venue_type: str | None = Field(None, max_length=100)
    guest_count: int | None = Field(None, ge=10, le=5000)
    budget_minor: int | None = Field(None, ge=1000000, le=10000000000)
    budget_rupees: float | None = Field(None, ge=10000.0, le=100000000.0)
    target_date: datetime | None = None
    preparation_months: int | None = Field(None, ge=1, le=36)
    status: str | None = None
    autonomy_mode: str | None = None
    ai_paused: bool | None = None

    @field_validator("title", "city", "venue_type", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class EventResponse(BaseModel):
    id: str
    user_id: str
    title: str
    event_type: str
    city: str
    venue_type: str
    guest_count: int
    budget_minor: int
    budget_rupees: float | None = None
    currency: str
    timezone: str
    preparation_months: int
    status: str
    autonomy_mode: str
    ai_paused: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at", mode="plain", check_fields=False)
    def serialize_datetime(self, dt: datetime | None) -> str | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
        return dt.isoformat()

    model_config = ConfigDict(from_attributes=True)

# --- EXPENSE & BUDGET SCHEMAS ---
class ExpenseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    planned_amount_minor: int = Field(..., gt=0, le=10000000000)
    planned_rupees: float | None = Field(None, gt=0.0, le=100000000.0)
    actual_amount_minor: int = Field(0, ge=0, le=10000000000)
    actual_rupees: float | None = Field(None, ge=0.0, le=100000000.0)
    provenance: str = "estimated"
    notes: str | None = Field(None, max_length=1000)

    @field_validator("name", "notes", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class ExpenseUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    planned_amount_minor: int | None = Field(None, gt=0, le=10000000000)
    planned_rupees: float | None = Field(None, gt=0.0, le=100000000.0)
    actual_amount_minor: int | None = Field(None, ge=0, le=10000000000)
    actual_rupees: float | None = Field(None, ge=0.0, le=100000000.0)
    provenance: str | None = None
    notes: str | None = Field(None, max_length=1000)
    expected_version: int | None = None

    @field_validator("name", "notes", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class ExpenseResponse(BaseModel):
    id: str
    category_id: str
    name: str
    planned_amount_minor: int
    planned_rupees: float | None = None
    actual_amount_minor: int
    actual_rupees: float | None = None
    provenance: str
    notes: str | None = None
    version: int = 1

    model_config = ConfigDict(from_attributes=True)

class BudgetCategoryCreate(BaseModel):
    name: str
    allocation_percent: float = 0.0
    allocation_basis_points: int | None = None
    allocated_amount_minor: int
    icon: str = "IndianRupee"
    is_per_guest: bool = False
    per_guest_minor: int = 0
    sort_order: int = 0

    @field_validator("name", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class BudgetCategoryUpdate(BaseModel):
    name: str | None = None
    allocation_percent: float | None = Field(None, ge=0.0, le=100.0)
    allocated_amount_minor: int | None = Field(None, ge=0, le=100000000000)
    icon: str | None = None
    is_per_guest: bool | None = None
    per_guest_minor: int | None = Field(None, ge=0, le=100000000000)
    sort_order: int | None = None
    expected_version: int | None = None

    @field_validator("name", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class BudgetCategoryResponse(BaseModel):
    id: str
    event_id: str
    name: str
    allocation_percent: float
    allocation_basis_points: int = 0
    allocated_amount_minor: int
    allocated_rupees: float | None = None
    icon: str
    is_per_guest: bool
    per_guest_minor: int
    per_guest_rupees: float | None = None
    sort_order: int
    version: int = 1
    expenses: list[ExpenseResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class BudgetSummaryResponse(BaseModel):
    total_budget_minor: int
    total_budget_rupees: float
    allocated_minor: int
    allocated_rupees: float
    allocatable_minor: int | None = 0
    allocatable_rupees: float | None = 0.0
    safety_buffer_minor: int | None = 0
    safety_buffer_rupees: float | None = 0.0
    unallocated_minor: int | None = 0
    unallocated_rupees: float | None = 0.0
    is_reconciled: bool | None = True
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
    categories: list[BudgetCategoryResponse]

class WhatIfSimulationRequest(BaseModel):
    simulated_guest_count: int
    simulated_budget_minor: int | None = None

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
    category_breakdowns: list[WhatIfCategoryChange]

# --- TASK & TIMELINE SCHEMAS ---
class TaskDependencyItem(BaseModel):
    task_id: str
    depends_on_task_id: str

class TaskDependencyCreate(BaseModel):
    depends_on_task_id: str

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    category: str = Field("General", max_length=100)
    milestone_name: str = Field("6 Months Out", max_length=100)
    days_before_event: int = Field(180, ge=0, le=1825)
    duration_days: int = Field(7, ge=1, le=365)
    priority: str = Field("medium", max_length=20)
    assigned_to: str = Field("Host", max_length=100)
    depends_on_ids: list[str] = Field(default_factory=list)

    @field_validator("title", "description", "category", "assigned_to", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    category: str | None = Field(None, max_length=100)
    milestone_name: str | None = Field(None, max_length=100)
    days_before_event: int | None = Field(None, ge=0, le=1825)
    duration_days: int | None = Field(None, ge=1, le=365)
    priority: str | None = Field(None, max_length=20)
    status: str | None = Field(None, max_length=50)
    assigned_to: str | None = Field(None, max_length=100)
    is_critical: bool | None = None
    expected_version: int | None = None

    @field_validator("title", "description", "category", "assigned_to", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class TaskResponse(BaseModel):
    id: str
    event_id: str
    title: str
    description: str | None = None
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
    version: int = 1
    created_at: datetime
    completed_at: datetime | None = None
    depends_on_ids: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class CPMResultResponse(BaseModel):
    total_duration_days: int
    critical_path_task_ids: list[str]
    tasks: list[TaskResponse]

# --- VENDOR & QUOTATION SCHEMAS ---
class QuotationCreate(BaseModel):
    vendor_id: str
    quoted_amount_minor: int
    status: str = "received"
    file_url: str | None = None
    inclusions: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    terms: dict[str, Any] = Field(default_factory=dict)
    detected_risks: list[str] = Field(default_factory=list)
    is_sample: bool = False

class QuotationResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name_cached: str | None = None
    quoted_amount_minor: int
    quoted_rupees: float | None = None
    status: str
    file_url: str | None = None
    inclusions: list[str]
    exclusions: list[str]
    terms: dict[str, Any]
    detected_risks: list[str]
    is_sample: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    contact: str | None = Field(None, max_length=255)
    rating: float = Field(4.5, ge=1.0, le=5.0)
    notes: str | None = Field(None, max_length=1000)

    @field_validator("category", "name", "contact", "notes", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class VendorResponse(BaseModel):
    id: str
    event_id: str
    category: str
    name: str
    contact: str | None = None
    status: str
    rating: float
    notes: str | None = None
    quotations: list[QuotationResponse] = Field(default_factory=list)

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
    inclusions: list[str]
    exclusions: list[str]
    detected_risks: list[str]
    risk_score: str # Low, Medium, High
    is_recommended: bool

class VendorComparisonResponse(BaseModel):
    category: str
    recommended_quotation_id: str | None = None
    missing_inclusions_warning: list[str] = Field(default_factory=list)
    comparison_items: list[QuotationComparisonItem] = Field(default_factory=list)

# --- APPROVAL & AUTONOMY SCHEMAS ---
class ApprovalCreate(BaseModel):
    proposal_type: str
    title: str
    summary: str
    diff_summary: dict[str, Any]
    proposed_changes_json: dict[str, Any]

class ApprovalAction(BaseModel):
    action: str = Field(..., max_length=20) # "approve" or "reject"
    comment: str | None = Field(None, max_length=1000)

    @field_validator("action", "comment", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class ApprovalResponse(BaseModel):
    id: str
    event_id: str
    proposal_type: str
    title: str
    summary: str
    diff_summary: dict[str, Any]
    proposed_changes_json: dict[str, Any]
    status: str
    created_at: datetime
    reviewed_at: datetime | None = None

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
    natural_language_prompt: str = Field(..., min_length=1, max_length=5000)

    @field_validator("natural_language_prompt", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

class ChatCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=1000)

    @field_validator("command", mode="before", check_fields=False)
    @classmethod
    def sanitize_strings(cls, v: Any) -> Any:
        return sanitize_free_text(v)

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
    cultural_traditions: list[str] = Field(default_factory=list)
    preparation_months: int = 6
    special_requirements: str = ""
    provenance: str = "ai_suggested"

class PersonalizedIdeasResponse(BaseModel):
    themes: list[dict[str, Any]]
    decor_concepts: list[dict[str, Any]]
    food_and_menu: list[dict[str, Any]]
    entertainment: list[dict[str, Any]]
    return_gifts: list[dict[str, Any]]
    cultural_traditions: list[dict[str, Any]]
    budget_conscious_alternatives: list[dict[str, Any]]

class PlanGenerationResponse(BaseModel):
    event_id: str
    plan_title: str
    summary: str
    blueprint_json: dict[str, Any]
    budget_allocation_summary: dict[str, Any]
    task_count: int
    milestone_count: int

# --- AGGREGATED EVENT OVERVIEW (PERFORMANCE OPTIMIZATION) ---
class EventOverviewResponse(BaseModel):
    event: EventResponse
    budget: BudgetSummaryResponse
    next_tasks: list[TaskResponse] = Field(default_factory=list)
    pending_approvals: list[ApprovalResponse] = Field(default_factory=list)
    vendors_count: int = 0
    recent_activities: list[ActivityLogResponse] = Field(default_factory=list)
