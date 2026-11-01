from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Event
from .auth import get_current_user

def get_event_for_user(
    event_id: str = Path(..., description="Unique event identifier"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Event:
    """
    Shared event-access dependency ensuring strict multi-tenant boundary.
    Returns the Event if owned by current_user, else raises 404.
    """
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event
