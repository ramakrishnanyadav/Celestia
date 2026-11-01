from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from ..models import User, Event, BudgetCategory, Expense
from ..schemas import (
    BudgetSummaryResponse, BudgetCategoryResponse, ExpenseResponse,
    BudgetCategoryCreate, BudgetCategoryUpdate, ExpenseCreate, ExpenseUpdate,
    WhatIfSimulationRequest, WhatIfSimulationResponse
)
from ..auth import get_current_user
from ..engines.budget_intelligence import (
    calculate_budget_summary, simulate_what_if_changes,
    paise_to_rupees, rupees_to_paise
)

router = APIRouter(prefix="/events/{event_id}/budget", tags=["Budget Intelligence"])

def enrich_category_response(cat: BudgetCategory) -> BudgetCategoryResponse:
    res = BudgetCategoryResponse.model_validate(cat)
    res.allocated_rupees = paise_to_rupees(cat.allocated_amount_minor)
    res.per_guest_rupees = paise_to_rupees(cat.per_guest_minor)
    for exp_res, exp_model in zip(res.expenses, cat.expenses):
        exp_res.planned_rupees = paise_to_rupees(exp_model.planned_amount_minor)
        exp_res.actual_rupees = paise_to_rupees(exp_model.actual_amount_minor)
    return res

@router.get("/summary", response_model=BudgetSummaryResponse)
def get_budget_summary(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    categories = db.query(BudgetCategory).options(
        selectinload(BudgetCategory.expenses)
    ).filter(
        BudgetCategory.event_id == event_id
    ).order_by(BudgetCategory.sort_order.asc()).all()
    
    summary = calculate_budget_summary(event, categories)
    summary["categories"] = [enrich_category_response(c) for c in categories]
    return summary

@router.post("/categories", response_model=BudgetCategoryResponse)
def create_category(
    event_id: str,
    cat_in: BudgetCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
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
    event_id: str,
    category_id: str,
    cat_in: BudgetCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    cat = db.query(BudgetCategory).filter(
        BudgetCategory.id == category_id,
        BudgetCategory.event_id == event_id
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
    event_id: str,
    category_id: str,
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    cat = db.query(BudgetCategory).filter(BudgetCategory.id == category_id, BudgetCategory.event_id == event_id).first()
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
    event_id: str,
    expense_id: str,
    exp_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    exp = db.query(Expense).join(BudgetCategory).filter(
        Expense.id == expense_id,
        BudgetCategory.event_id == event_id
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
    event_id: str,
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    exp = db.query(Expense).join(BudgetCategory).filter(
        Expense.id == expense_id,
        BudgetCategory.event_id == event_id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted successfully"}

@router.post("/what-if", response_model=WhatIfSimulationResponse)
def simulate_budget_scenario(
    event_id: str,
    sim_in: WhatIfSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    categories = db.query(BudgetCategory).filter(
        BudgetCategory.event_id == event_id
    ).order_by(BudgetCategory.sort_order.asc()).all()
    
    result = simulate_what_if_changes(
        event,
        categories,
        sim_in.simulated_guest_count,
        sim_in.simulated_budget_minor
    )
    return result
