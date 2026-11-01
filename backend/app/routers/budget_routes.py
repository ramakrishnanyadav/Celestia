import csv
import io
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..dependencies import get_event_for_user
from ..engines.budget_intelligence import (
    calculate_budget_summary,
    paise_to_rupees,
    simulate_what_if_changes,
)
from ..models import BudgetCategory, Event, Expense
from ..schemas import (
    BudgetCategoryCreate,
    BudgetCategoryResponse,
    BudgetCategoryUpdate,
    BudgetSummaryResponse,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
)

router = APIRouter(prefix="/events/{event_id}/budget", tags=["Budget Intelligence"])

def enrich_category_response(cat: BudgetCategory) -> BudgetCategoryResponse:
    res = BudgetCategoryResponse.model_validate(cat)
    res.allocated_rupees = paise_to_rupees(cat.allocated_amount_minor)
    res.per_guest_rupees = paise_to_rupees(cat.per_guest_minor)
    for exp_res, exp_model in zip(res.expenses, cat.expenses, strict=False):
        exp_res.planned_rupees = paise_to_rupees(exp_model.planned_amount_minor)
        exp_res.actual_rupees = paise_to_rupees(exp_model.actual_amount_minor)
    return res

@router.get("/summary", response_model=BudgetSummaryResponse)
def get_budget_summary(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    categories = db.query(BudgetCategory).options(
        selectinload(BudgetCategory.expenses)
    ).filter(
        BudgetCategory.event_id == event.id
    ).order_by(BudgetCategory.sort_order.asc()).all()

    summary = calculate_budget_summary(event, categories)
    summary["categories"] = [enrich_category_response(c) for c in categories]
    return summary

@router.post("/what-if", response_model=WhatIfSimulationResponse)
def simulate_what_if(
    sim_req: WhatIfSimulationRequest,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    categories = db.query(BudgetCategory).options(
        selectinload(BudgetCategory.expenses)
    ).filter(
        BudgetCategory.event_id == event.id
    ).order_by(BudgetCategory.sort_order.asc()).all()

    return simulate_what_if_changes(
        event=event,
        categories=categories,
        simulated_guest_count=sim_req.simulated_guest_count,
        simulated_budget_minor=sim_req.simulated_budget_minor,
    )

@router.post("/categories", response_model=BudgetCategoryResponse)
def create_category(
    cat_in: BudgetCategoryCreate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    cat = BudgetCategory(
        event_id=event.id,
        name=cat_in.name,
        allocation_percent=cat_in.allocation_percent,
        allocated_amount_minor=cat_in.allocated_amount_minor,
        icon=cat_in.icon,
        is_per_guest=cat_in.is_per_guest,
        per_guest_minor=cat_in.per_guest_minor,
        sort_order=cat_in.sort_order
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return enrich_category_response(cat)

@router.patch("/categories/{category_id}", response_model=BudgetCategoryResponse)
def update_category(
    category_id: str,
    cat_in: BudgetCategoryUpdate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    cat = db.query(BudgetCategory).filter(
        BudgetCategory.id == category_id,
        BudgetCategory.event_id == event.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    data = cat_in.model_dump(exclude_unset=True)
    if "expected_version" in data:
        data.pop("expected_version")
        if cat.version != cat_in.expected_version:
            raise HTTPException(
                status_code=409,
                detail=f"Conflict: Category was modified by another user (expected version {cat_in.expected_version}, current version {cat.version}). Please refresh and retry."
            )
        cat.version += 1

    for k, v in data.items():
        setattr(cat, k, v)

    db.commit()
    db.refresh(cat)
    return enrich_category_response(cat)

@router.post("/categories/{category_id}/expenses", response_model=ExpenseResponse)
def add_expense(
    category_id: str,
    exp_in: ExpenseCreate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    cat = db.query(BudgetCategory).filter(
        BudgetCategory.id == category_id,
        BudgetCategory.event_id == event.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    exp = Expense(
        category_id=cat.id,
        name=exp_in.name,
        planned_amount_minor=exp_in.planned_amount_minor,
        actual_amount_minor=exp_in.actual_amount_minor,
        provenance=exp_in.provenance,
        notes=exp_in.notes
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    res = ExpenseResponse.model_validate(exp)
    res.planned_rupees = paise_to_rupees(exp.planned_amount_minor)
    res.actual_rupees = paise_to_rupees(exp.actual_amount_minor)
    return res

@router.patch("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    exp_in: ExpenseUpdate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    exp = db.query(Expense).join(BudgetCategory).filter(
        Expense.id == expense_id,
        BudgetCategory.event_id == event.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    data = exp_in.model_dump(exclude_unset=True)
    if "expected_version" in data:
        data.pop("expected_version")
        if exp.version != exp_in.expected_version:
            raise HTTPException(
                status_code=409,
                detail=f"Conflict: Expense was modified by another user (expected version {exp_in.expected_version}, current version {exp.version}). Please refresh and retry."
            )
        exp.version += 1

    for k, v in data.items():
        setattr(exp, k, v)

    db.commit()
    db.refresh(exp)

    res = ExpenseResponse.model_validate(exp)
    res.planned_rupees = paise_to_rupees(exp.planned_amount_minor)
    res.actual_rupees = paise_to_rupees(exp.actual_amount_minor)
    return res

@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: str,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    exp = db.query(Expense).join(BudgetCategory).filter(
        Expense.id == expense_id,
        BudgetCategory.event_id == event.id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted successfully"}

def sanitize_csv_cell(value: Any) -> str:
    """Neutralizes CSV Formula Injection (DDE injection) attacks."""
    s = str(value)
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s

@router.get("/export-csv")
def export_budget_csv(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    """
    Exports event budget ledger to CSV with formula injection neutralization.
    """
    categories = db.query(BudgetCategory).options(
        selectinload(BudgetCategory.expenses)
    ).filter(BudgetCategory.event_id == event.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Category", "Allocation Minor", "Allocation INR", "Expense Name", "Planned Minor", "Actual Minor", "Provenance"])

    for cat in categories:
        cat_name = sanitize_csv_cell(cat.name)
        alloc_inr = paise_to_rupees(cat.allocated_amount_minor)
        if not cat.expenses:
            writer.writerow([cat_name, cat.allocated_amount_minor, alloc_inr, "", "", "", ""])
        else:
            for exp in cat.expenses:
                writer.writerow([
                    cat_name,
                    cat.allocated_amount_minor,
                    alloc_inr,
                    sanitize_csv_cell(exp.name),
                    exp.planned_amount_minor,
                    exp.actual_amount_minor,
                    sanitize_csv_cell(exp.provenance)
                ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=budget_{event.id}.csv"}
    )
