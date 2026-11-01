import hashlib
import json
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import IdempotencyRecord

IDEMPOTENCY_DEFAULT_TTL_SECONDS = 86400  # 24 hours

def compute_request_hash(payload: Any) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def check_idempotency(
    db: Session,
    idempotency_key: str | None,
    user_id: str,
    endpoint: str,
    payload: Any,
    ttl_seconds: int = IDEMPOTENCY_DEFAULT_TTL_SECONDS
) -> tuple[int, Any] | None:
    """
    Checks if an idempotent operation was already completed.
    Returns (status_code, response_body) if found, or None if new request.
    Raises HTTPException(422) if key is reused with different payload or cross-endpoint.
    Scopes keys per user and per endpoint, with automatic TTL expiration.
    """
    if not idempotency_key:
        return None

    # First check for exact user + endpoint match
    record = db.query(IdempotencyRecord).filter(
        IdempotencyRecord.key == idempotency_key,
        IdempotencyRecord.user_id == user_id,
        IdempotencyRecord.endpoint == endpoint
    ).first()

    if not record:
        # Check if the user reused this key for a DIFFERENT endpoint
        other_ep_record = db.query(IdempotencyRecord).filter(
            IdempotencyRecord.key == idempotency_key,
            IdempotencyRecord.user_id == user_id
        ).first()
        if other_ep_record:
            raise HTTPException(
                status_code=422,
                detail="Idempotency key was previously used with a different request payload or endpoint."
            )
        return None

    # Check TTL expiration
    now = datetime.now(UTC)
    if record.created_at:
        created = record.created_at if record.created_at.tzinfo else record.created_at.replace(tzinfo=UTC)
        if (now - created).total_seconds() > ttl_seconds:
            # Expired: clean up record and allow new request
            db.delete(record)
            db.commit()
            return None

    req_hash = compute_request_hash(payload)
    if record.request_hash != req_hash:
        raise HTTPException(
            status_code=422,
            detail="Idempotency key was previously used with a different request payload or endpoint."
        )

    return int(record.response_code), record.response_body

def record_idempotency(
    db: Session,
    idempotency_key: str | None,
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
