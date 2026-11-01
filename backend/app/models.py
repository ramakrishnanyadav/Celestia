import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(UTC)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="planner")
    is_demo = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False, index=True) # "wedding", "birthday", "community"
    city = Column(String(100), default="Mumbai")
    venue_type = Column(String(100), default="Banquet Hall")
    guest_count = Column(Integer, default=300, nullable=False)
    budget_minor = Column(BigInteger, default=150000000, nullable=False) # In paise: 15,00,000 INR = 150,000,000 paise
    currency = Column(String(10), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata")
    target_date = Column(DateTime(timezone=True), nullable=True)
    preparation_months = Column(Integer, default=6)
    status = Column(String(50), default="planning") # planning, confirmed, completed
    autonomy_mode = Column(String(20), default="Draft") # Suggest, Draft, Approve
    ai_paused = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="events")

    __table_args__ = (
        CheckConstraint("guest_count >= 10 AND guest_count <= 5000", name="check_event_guest_count"),
        CheckConstraint("budget_minor >= 1000000 AND budget_minor <= 10000000000", name="check_event_budget_minor"),
        CheckConstraint("preparation_months >= 1 AND preparation_months <= 36", name="check_event_prep_months"),
    )
    preference = relationship("EventPreference", back_populates="event", uselist=False, cascade="all, delete-orphan")
    plans = relationship("EventPlan", back_populates="event", cascade="all, delete-orphan")
    budget_categories = relationship("BudgetCategory", back_populates="event", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="event", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="event", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="event", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="event", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="event", cascade="all, delete-orphan")

class EventPreference(Base):
    __tablename__ = "event_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), unique=True, nullable=False)
    dietary = Column(String(100), default="Pure Vegetarian")
    theme = Column(String(255), default="Royal Marigold & Polished Brass")
    regional_culture = Column(String(100), default="Maharashtrian Traditional")
    cultural_traditions = Column(JSON, default=list) # e.g. ["Sakhar Puda", "Muhurtham", "Haldi", "Sangeet", "Satyanarayan Puja"]
    music_entertainment = Column(String(255), default="Traditional Shehnai & Dhol-Tasha + Modern Sangeet DJ")
    color_palette = Column(JSON, default=lambda: ["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"])
    special_requirements = Column(Text, default="Wheelchair accessible entrance, priority elderly seating, eco-friendly return gifts.")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    event = relationship("Event", back_populates="preference")

class EventPlan(Base):
    __tablename__ = "event_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1)
    title = Column(String(255), default="Master Event Blueprint")
    summary = Column(Text, nullable=True)
    blueprint_json = Column(JSON, default=dict) # High-level structured sections
    status = Column(String(50), default="active") # active, draft, archived
    created_at = Column(DateTime(timezone=True), default=utc_now)

    event = relationship("Event", back_populates="plans")

class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    allocation_basis_points = Column(Integer, default=0, nullable=False) # 100% = 10000 basis points
    allocated_amount_minor = Column(BigInteger, default=0) # Integer minor units (paise)
    icon = Column(String(50), default="IndianRupee")
    is_per_guest = Column(Boolean, default=False)
    per_guest_minor = Column(BigInteger, default=0) # Unit price per guest
    sort_order = Column(Integer, default=0)
    version = Column(Integer, default=1, nullable=False)

    @property
    def allocation_percent(self) -> float:
        return self.allocation_basis_points / 100.0

    @allocation_percent.setter
    def allocation_percent(self, val: float) -> None:
        self.allocation_basis_points = int(round(val * 100))

    event = relationship("Event", back_populates="budget_categories")
    expenses = relationship("Expense", back_populates="category", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("allocation_basis_points >= 0 AND allocation_basis_points <= 10000", name="check_cat_allocation_basis_points"),
        CheckConstraint("allocated_amount_minor >= 0", name="check_cat_allocated_amount"),
    )

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("budget_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    planned_amount_minor = Column(BigInteger, default=0)
    actual_amount_minor = Column(BigInteger, default=0)
    provenance = Column(String(50), default="estimated") # user_provided, verified, calculated, estimated, ai_suggested, unknown
    notes = Column(Text, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    category = relationship("BudgetCategory", back_populates="expenses")

    __table_args__ = (
        CheckConstraint("planned_amount_minor > 0", name="check_exp_planned_amount"),
        CheckConstraint("actual_amount_minor >= 0", name="check_exp_actual_amount"),
    )

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General") # Venue, Catering, Decor, Photography, Attire, Logistics
    milestone_name = Column(String(100), default="6 Months Out")
    days_before_event = Column(Integer, default=180) # Relative schedule anchor
    duration_days = Column(Integer, default=7)
    priority = Column(String(20), default="medium") # critical, high, medium, low
    status = Column(String(50), default="pending") # pending, in_progress, completed, overdue
    assigned_to = Column(String(100), default="Host")
    is_critical = Column(Boolean, default=False) # CPM Critical Path Flag
    early_start_day = Column(Integer, default=0)
    early_finish_day = Column(Integer, default=0)
    late_start_day = Column(Integer, default=0)
    late_finish_day = Column(Integer, default=0)
    total_slack = Column(Integer, default=0)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    event = relationship("Event", back_populates="tasks")
    dependencies = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="task",
        cascade="all, delete-orphan"
    )
    dependents = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.depends_on_task_id",
        back_populates="depends_on_task",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("duration_days >= 1 AND duration_days <= 365", name="check_task_duration_days"),
        CheckConstraint("days_before_event >= 0 AND days_before_event <= 1825", name="check_task_days_before_event"),
    )

class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    depends_on_task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)

    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on_task = relationship("Task", foreign_keys=[depends_on_task_id], back_populates="dependents")

    __table_args__ = (
        CheckConstraint("task_id != depends_on_task_id", name="check_no_self_dependency"),
    )

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False) # Catering, Venue, Decor, Photography, Entertainment
    name = Column(String(255), nullable=False)
    contact = Column(String(255), nullable=True)
    status = Column(String(50), default="shortlisted") # shortlisted, requested_quote, comparing, hired, rejected
    rating = Column(Float, default=4.5)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    event = relationship("Event", back_populates="vendors")
    quotations = relationship("Quotation", back_populates="vendor", cascade="all, delete-orphan")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_name_cached = Column(String(255), nullable=True)
    quoted_amount_minor = Column(BigInteger, default=0)
    status = Column(String(50), default="received") # received, reviewing, accepted, rejected
    file_url = Column(String(500), nullable=True)
    inclusions = Column(JSON, default=list) # List of service items
    exclusions = Column(JSON, default=list) # What is NOT included
    terms = Column(JSON, default=dict) # Advance %, Cancellation policy, Overtime charges
    detected_risks = Column(JSON, default=list) # Identified contract risks
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    vendor = relationship("Vendor", back_populates="quotations")

    __table_args__ = (
        CheckConstraint("quoted_amount_minor >= 0", name="check_quote_amount"),
    )

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), default="application/pdf")
    extracted_text = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    event = relationship("Event", back_populates="documents")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    proposal_type = Column(String(100), nullable=False) # "budget_rebalance", "timeline_reschedule", "guest_scaling", "vendor_switch"
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    diff_summary = Column(JSON, default=dict) # { "before": ..., "after": ..., "changes": [...] }
    proposed_changes_json = Column(JSON, default=dict) # Full payload to apply upon confirmation
    status = Column(String(50), default="pending") # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), default=utc_now)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    event = relationship("Event", back_populates="approvals")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="check_approval_status"),
    )

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    actor = Column(String(50), default="AI") # User, AI, System
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    event = relationship("Event", back_populates="activity_logs")

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(255), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(String(255), nullable=False)
    request_hash = Column(String(64), nullable=False)
    response_code = Column(Integer, nullable=False, default=200)
    response_body = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    replaced_by = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="refresh_tokens")
