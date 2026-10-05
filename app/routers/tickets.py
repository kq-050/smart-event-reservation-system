from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..auth import require_organizer
from ..database import get_db, utc_now
from ..schemas import TicketTypeCreate, TicketTypeResponse


router = APIRouter(
    prefix="",
    tags=["Ticket Types"]
)


@router.post(
    "/events/{event_id}/ticket-types",
    response_model=TicketTypeResponse,
    status_code=201
)
def create_ticket_type(
    event_id: int,
    ticket: TicketTypeCreate,
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
            detail="You can only manage ticket types for your own events"
        )

    existing_ticket_types = db.query(models.TicketType).filter(
        models.TicketType.event_id == event_id
    ).all()

    total_ticket_quantity = sum(
        existing_ticket.quantity
        for existing_ticket in existing_ticket_types
    )

    if total_ticket_quantity + ticket.quantity > event.capacity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Ticket quantity exceeds event capacity. "
                f"Only {event.capacity - total_ticket_quantity} "
                f"tickets can be added."
            )
        )

    new_ticket = models.TicketType(
        event_id=event_id,
        name=ticket.name,
        price=ticket.price,
        quantity=ticket.quantity
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket


@router.get(
    "/events/{event_id}/ticket-types",
    response_model=list[TicketTypeResponse]
)
def get_ticket_types(
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

    ticket_types = db.query(models.TicketType).filter(
        models.TicketType.event_id == event_id
    ).all()

    return ticket_types


@router.put(
    "/ticket-types/{ticket_type_id}",
    response_model=TicketTypeResponse
)
def update_ticket_type(
    ticket_type_id: int,
    ticket: TicketTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_organizer)
):
    existing_ticket = db.query(models.TicketType).filter(
        models.TicketType.id == ticket_type_id
    ).first()

    if not existing_ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket type not found"
        )

    event = db.query(models.Event).filter(
        models.Event.id == existing_ticket.event_id
    ).first()

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage your own ticket types"
        )

    other_ticket_types = db.query(models.TicketType).filter(
        models.TicketType.event_id == event.id,
        models.TicketType.id != ticket_type_id
    ).all()

    total_other_quantity = sum(
        existing_ticket.quantity
        for existing_ticket in other_ticket_types
    )

    if total_other_quantity + ticket.quantity > event.capacity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Ticket quantity exceeds event capacity. "
                f"Only {event.capacity - total_other_quantity} "
                f"tickets can be assigned."
            )
        )

    existing_ticket.name = ticket.name
    existing_ticket.price = ticket.price
    existing_ticket.quantity = ticket.quantity

    db.commit()
    db.refresh(existing_ticket)

    return existing_ticket


@router.delete("/ticket-types/{ticket_type_id}")
def delete_ticket_type(
    ticket_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_organizer)
):
    ticket = db.query(models.TicketType).filter(
        models.TicketType.id == ticket_type_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket type not found"
        )

    event = db.query(models.Event).filter(
        models.Event.id == ticket.event_id
    ).first()

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage your own ticket types"
        )
    existing_reservations = (
    db.query(models.Reservation)
    .filter(
        models.Reservation.ticket_type_id == ticket_type_id
    )
    .first()
    )

    if existing_reservations:
        raise HTTPException(
            status_code=400,
            detail=(
                "This ticket type cannot be deleted because "
                "reservations already exist for it."
            )
        )

    db.delete(ticket)
    db.commit()

    return {
        "message": "Ticket type deleted successfully"
    }



@router.get("/ticket-types/{ticket_type_id}/availability")
def get_ticket_availability(
    ticket_type_id: int,
    db: Session = Depends(get_db)
):
    ticket_type = db.query(models.TicketType).filter(
        models.TicketType.id == ticket_type_id
    ).first()

    if not ticket_type:
        raise HTTPException(
            status_code=404,
            detail="Ticket type not found"
        )

    # Use naive UTC datetime to match the current database setup
    now = utc_now()

    reservations = db.query(models.Reservation).filter(
        models.Reservation.ticket_type_id == ticket_type_id,
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

    available_quantity = ticket_type.quantity - reserved_quantity

    return {
        "ticket_type_id": ticket_type.id,
        "ticket_type_name": ticket_type.name,
        "total_quantity": ticket_type.quantity,
        "reserved_quantity": reserved_quantity,
        "available_quantity": max(available_quantity, 0)
    }