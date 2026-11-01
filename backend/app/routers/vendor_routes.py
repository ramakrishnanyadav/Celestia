
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_event_for_user
from ..engines.ai_gateway import ai_gateway
from ..engines.budget_intelligence import paise_to_rupees
from ..engines.vendor_intelligence import analyze_quotation_risks, compare_quotations_for_category
from ..models import Document, Event, Quotation, Vendor
from ..rate_limiter import rate_limit_upload
from ..schemas import (
    QuotationCreate,
    QuotationResponse,
    VendorComparisonResponse,
    VendorCreate,
    VendorResponse,
)

router = APIRouter(prefix="/events/{event_id}/vendors", tags=["Vendor Intelligence"])

def enrich_vendor_response(v: Vendor) -> VendorResponse:
    res = VendorResponse.model_validate(v)
    for q_res, q_model in zip(res.quotations, v.quotations, strict=False):
        q_res.quoted_rupees = paise_to_rupees(q_model.quoted_amount_minor)
    return res

@router.get("", response_model=list[VendorResponse])
def list_vendors(
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    vendors = db.query(Vendor).filter(Vendor.event_id == event.id).all()
    return [enrich_vendor_response(v) for v in vendors]

@router.post("", response_model=VendorResponse)
def create_vendor(
    vendor_in: VendorCreate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
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

@router.post("/{vendor_id}/quotations", response_model=QuotationResponse, dependencies=[Depends(rate_limit_upload)])
def add_quotation(
    vendor_id: str,
    quote_in: QuotationCreate,
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.event_id == event.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Scan for indirect prompt injection in terms and vendor remarks
    ai_gateway.sanitize_untrusted_input(quote_in.terms or "", "quotation terms")
    for inc in quote_in.inclusions:
        ai_gateway.sanitize_untrusted_input(inc, "quotation inclusion")
    for exc in quote_in.exclusions:
        ai_gateway.sanitize_untrusted_input(exc, "quotation exclusion")

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
    category: str = "Catering",
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    return compare_quotations_for_category(db, event.id, category)

@router.post("/documents/upload", dependencies=[Depends(rate_limit_upload)])
async def upload_vendor_document(
    file: UploadFile = File(...),
    doc_type: str = Form("contract"),
    event: Event = Depends(get_event_for_user),
    db: Session = Depends(get_db)
):
    """
    Secure document upload endpoint with rate limiting, file type and size validation.
    """
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file format. Only PDF, JPEG, and PNG documents are permitted."
        )

    content = await file.read()
    max_bytes = 10 * 1024 * 1024 # 10MB
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowable limit of 10 MB."
        )

    # Persist document metadata
    doc = Document(
        event_id=event.id,
        filename=file.filename or "upload.pdf",
        file_path=f"uploads/{event.id}/{file.filename}",
        doc_type=doc_type,
        parsed_status="ready"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"status": "uploaded", "document_id": doc.id, "filename": doc.filename}
