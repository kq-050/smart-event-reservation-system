from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models
from ..auth import require_organizer
from ..database import get_db, utc_now
from ..schemas import EventCreate, EventUpdate, EventResponse, EventDetailsResponse


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.get("", response_model=list[EventResponse])
def get_events(
    search: str | None = None,
    location: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(models.Event)

    if search:
        query = query.filter(
            models.Event.name.ilike(f"%{search}%")
        )

    if location:
        query = query.filter(
            models.Event.location.ilike(f"%{location}%")
        )

    events = (
        query
        .order_by(models.Event.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return events


@router.get("/{event_id}/details", response_model=EventDetailsResponse)
def get_event_details(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    now = utc_now()

    ticket_types = db.query(models.TicketType).filter(
        models.TicketType.event_id == event_id
    ).all()

    ticket_availability = []

    for ticket_type in ticket_types:
        reservations = db.query(models.Reservation).filter(
            models.Reservation.ticket_type_id == ticket_type.id,
            (
                (models.Reservation.status == "confirmed") |
                (
                    (models.Reservation.status == "active") &
                    (models.Reservation.expires_at > now)
                )
            )
        ).all()

        reserved_quantity = sum(
            reservation.quantity
            for reservation in reservations
        )

        available_quantity = max(
            ticket_type.quantity - reserved_quantity,
            0
        )

        ticket_availability.append({
            "ticket_type_id": ticket_type.id,
            "ticket_type_name": ticket_type.name,
            "total_quantity": ticket_type.quantity,
            "reserved_quantity": reserved_quantity,
            "available_quantity": available_quantity
        })

    return {
        "id": event.id,
        "name": event.name,
        "location": event.location,
        "capacity": event.capacity,
        "organizer_id": event.organizer_id,
        "ticket_types": ticket_availability
    }


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return event


@router.post("", response_model=EventResponse, status_code=201)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_organizer)
):
    new_event = models.Event(
        name=event.name,
        location=event.location,
        capacity=event.capacity,
        organizer_id=current_user.id
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event: EventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_organizer)
):
    existing_event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if not existing_event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if existing_event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own events"
        )
    
    existing_ticket_types = (
    db.query(models.TicketType)
    .filter(models.TicketType.event_id == event_id)
    .all()
    )

    total_ticket_quantity = sum(
        ticket.quantity
        for ticket in existing_ticket_types
    )

    if event.capacity < total_ticket_quantity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Event capacity cannot be reduced below "
                f"the total ticket quantity ({total_ticket_quantity})."
            )
        )
    
    existing_event.name = event.name
    existing_event.location = event.location
    existing_event.capacity = event.capacity

    db.commit()
    db.refresh(existing_event)

    return existing_event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_organizer)
):
    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own events"
        )
    existing_ticket_types = (
    db.query(models.TicketType)
    .filter(models.TicketType.event_id == event_id)
    .first()
    )

    if existing_ticket_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "This event cannot be deleted because "
                "ticket types already exist for it."
            )
        )

    db.delete(event)
    db.commit()

    return {
        "message": "Event deleted successfully"
    }
    
    

