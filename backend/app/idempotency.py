import json
import hashlib
from typing import Optional, Any, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session
from .models import IdempotencyRecord

def compute_request_hash(payload: Any) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def check_idempotency(
    db: Session,
    idempotency_key: Optional[str],
    user_id: str,
    endpoint: str,
    payload: Any
) -> Optional[Tuple[int, Any]]:
    """
    Checks if an idempotent operation was already completed.
    Returns (status_code, response_body) if found, or None if new request.
    Raises HTTPException(422) if key is reused with different payload.
    """
    if not idempotency_key:
        return None

    record = db.query(IdempotencyRecord).filter(
        IdempotencyRecord.key == idempotency_key,
        IdempotencyRecord.user_id == user_id
    ).first()

    if not record:
        return None

    req_hash = compute_request_hash(payload)
    if record.endpoint != endpoint or record.request_hash != req_hash:
        raise HTTPException(
            status_code=422,
            detail="Idempotency key was previously used with a different request payload or endpoint."
        )

    return record.response_code, record.response_body

def record_idempotency(
    db: Session,
    idempotency_key: Optional[str],
    user_id: str,
    endpoint: str,
    payload: Any,
    response_code: int,
    response_body: Any
) -> None:
    """Stores the execution result for an idempotency key."""
    if not idempotency_key:
        return

    req_hash = compute_request_hash(payload)
    rec = IdempotencyRecord(
        key=idempotency_key,
        user_id=user_id,
        endpoint=endpoint,
        request_hash=req_hash,
        response_code=response_code,
        response_body=response_body
    )
    db.add(rec)
    db.commit()
