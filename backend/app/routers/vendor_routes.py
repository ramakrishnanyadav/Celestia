from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Event, Vendor, Quotation
from ..schemas import (
    VendorCreate, VendorResponse, QuotationCreate, QuotationResponse,
    VendorComparisonResponse
)
from ..auth import get_current_user
from ..engines.budget_intelligence import paise_to_rupees
from ..engines.vendor_intelligence import compare_quotations_for_category, analyze_quotation_risks

router = APIRouter(prefix="/events/{event_id}/vendors", tags=["Vendor Intelligence"])

def enrich_vendor_response(v: Vendor) -> VendorResponse:
    res = VendorResponse.model_validate(v)
    for q_res, q_model in zip(res.quotations, v.quotations):
        q_res.quoted_rupees = paise_to_rupees(q_model.quoted_amount_minor)
    return res

@router.get("", response_model=List[VendorResponse])
def list_vendors(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    vendors = db.query(Vendor).filter(Vendor.event_id == event_id).all()
    return [enrich_vendor_response(v) for v in vendors]

@router.post("", response_model=VendorResponse)
def create_vendor(
    event_id: str,
    vendor_in: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    vendor = Vendor(
        event_id=event.id,
        category=vendor_in.category,
        name=vendor_in.name,
        contact=vendor_in.contact,
        status="shortlisted",
        rating=vendor_in.rating,
        notes=vendor_in.notes
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return enrich_vendor_response(vendor)

@router.post("/{vendor_id}/quotations", response_model=QuotationResponse)
def add_quotation(
    event_id: str,
    vendor_id: str,
    quote_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.event_id == event_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    # Analyze risks
    detected_risks = analyze_quotation_risks(quote_in.terms, quote_in.inclusions, quote_in.exclusions)
    all_risks = list(set(detected_risks + quote_in.detected_risks))
    
    quote = Quotation(
        vendor_id=vendor.id,
        vendor_name_cached=vendor.name,
        quoted_amount_minor=quote_in.quoted_amount_minor,
        status=quote_in.status,
        file_url=quote_in.file_url,
        inclusions=quote_in.inclusions,
        exclusions=quote_in.exclusions,
        terms=quote_in.terms,
        detected_risks=all_risks,
        is_sample=quote_in.is_sample
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    
    res = QuotationResponse.model_validate(quote)
    res.quoted_rupees = paise_to_rupees(quote.quoted_amount_minor)
    return res

@router.get("/compare", response_model=VendorComparisonResponse)
def compare_quotations(
    event_id: str,
    category: str = "Catering",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return compare_quotations_for_category(db, event_id, category)
