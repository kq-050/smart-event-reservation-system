from typing import Literal
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from .. import models
from ..auth import require_organizer
from ..database import get_db
from ..schemas import (
    EventResponse,
    OrganizerReservationResponse,
    OrganizerDashboardResponse
)


router = APIRouter(
    prefix="/organizer",
    tags=["Organizer"]
)


@router.get(
    "/dashboard",
    response_model=OrganizerDashboardResponse
)
def get_organizer_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_organizer)
):
    events = (
        db.query(models.Event)
        .filter(
            models.Event.organizer_id == current_user.id
        )
        .all()
    )

    event_ids = [event.id for event in events]

    ticket_types = []

    if event_ids:
        ticket_types = (
            db.query(models.TicketType)
            .filter(
                models.TicketType.event_id.in_(event_ids)
            )
            .all()
        )

    ticket_type_ids = [
        ticket.id
        for ticket in ticket_types
    ]

    reservations = []

    if ticket_type_ids:
        reservations = (
            db.query(models.Reservation)
            .filter(
                models.Reservation.ticket_type_id.in_(
                    ticket_type_ids
                )
            )
            .all()
        )

    confirmed = [
        reservation
        for reservation in reservations
        if reservation.status == "confirmed"
    ]

    active = [
        reservation
        for reservation in reservations
        if reservation.status == "active"
    ]

    cancelled = [
        reservation
        for reservation in reservations
        if reservation.status == "cancelled"
    ]

    expired = [
        reservation
        for reservation in reservations
        if reservation.status == "expired"
    ]

    total_tickets_sold = sum(
        reservation.quantity
        for reservation in confirmed
    )

    total_revenue = 0

    for reservation in confirmed:
        ticket_type = next(
            (
                ticket
                for ticket in ticket_types
                if ticket.id == reservation.ticket_type_id
            ),
            None
        )

        if ticket_type:
            total_revenue += (
                ticket_type.price *
                reservation.quantity
            )

    event_stats = []

    for event in events:
        event_ticket_types = [
            ticket
            for ticket in ticket_types
            if ticket.event_id == event.id
        ]

        event_ticket_type_ids = {
            ticket.id
            for ticket in event_ticket_types
        }

        event_reservations = [
            reservation
            for reservation in reservations
            if reservation.ticket_type_id
            in event_ticket_type_ids
        ]

        event_confirmed = [
            reservation
            for reservation in event_reservations
            if reservation.status == "confirmed"
        ]

        event_active = [
            reservation
            for reservation in event_reservations
            if reservation.status == "active"
        ]

        event_cancelled = [
            reservation
            for reservation in event_reservations
            if reservation.status == "cancelled"
        ]

        event_expired = [
            reservation
            for reservation in event_reservations
            if reservation.status == "expired"
        ]

        total_event_tickets = sum(
            ticket.quantity
            for ticket in event_ticket_types
        )

        event_tickets_sold = sum(
            reservation.quantity
            for reservation in event_confirmed
        )

        event_revenue = 0

        for reservation in event_confirmed:
            ticket_type = next(
                (
                    ticket
                    for ticket in event_ticket_types
                    if ticket.id == reservation.ticket_type_id
                ),
                None
            )

            if ticket_type:
                event_revenue += (
                    ticket_type.price *
                    reservation.quantity
                )

        event_stats.append(
            {
                "event_id": event.id,
                "event_name": event.name,
                "capacity": event.capacity,
                "total_ticket_types": len(event_ticket_types),
                "total_tickets": total_event_tickets,
                "tickets_sold": event_tickets_sold,
                "tickets_available": max(
                    total_event_tickets - event_tickets_sold,
                    0
                ),
                "total_reservations": len(event_reservations),
                "confirmed_bookings": len(event_confirmed),
                "active_reservations": len(event_active),
                "cancelled_reservations": len(event_cancelled),
                "expired_reservations": len(event_expired),
                "total_revenue": event_revenue
            }
        )

    return {
        "total_events": len(events),
        "total_ticket_types": len(ticket_types),
        "total_reservations": len(reservations),
        "confirmed_bookings": len(confirmed),
        "active_reservations": len(active),
        "cancelled_reservations": len(cancelled),
        "expired_reservations": len(expired),
        "total_tickets_sold": total_tickets_sold,
        "total_revenue": total_revenue,
        "events": event_stats
    }

@router.get("/events", response_model=list[EventResponse])
def get_my_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(require_organizer),
    db: Session = Depends(get_db)
):
    events = (
        db.query(models.Event)
        .filter(
            models.Event.organizer_id == current_user.id
        )
        .order_by(models.Event.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return events


@router.get("/events/{event_id}/tickets")
def get_my_event_tickets(
    event_id: int,
    current_user: models.User = Depends(require_organizer),
    db: Session = Depends(get_db)
):
    event = (
        db.query(models.Event)
        .filter(
            models.Event.id == event_id,
            models.Event.organizer_id == current_user.id
        )
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found or you do not have access to this event"
        )

    ticket_types = (
        db.query(models.TicketType)
        .filter(
            models.TicketType.event_id == event_id
        )
        .all()
    )

    return {
        "event_id": event.id,
        "event_name": event.name,
        "ticket_types": ticket_types
    }
    

@router.get(
    "/reservations",
    response_model=list[OrganizerReservationResponse]
)
def get_organizer_reservations(
    status: Literal["active", "confirmed", "cancelled", "expired"] | None = Query(default=None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(require_organizer),
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            models.Reservation,
            models.User,
            models.TicketType,
            models.Event
        )
        .join(
            models.User,
            models.Reservation.user_id == models.User.id
        )
        .join(
            models.TicketType,
            models.Reservation.ticket_type_id == models.TicketType.id
        )
        .join(
            models.Event,
            models.TicketType.event_id == models.Event.id
        )
        .filter(
            models.Event.organizer_id == current_user.id
        )
    )

    if status:
        query = query.filter(
            models.Reservation.status == status
        )

    results = (
        query
        .order_by(models.Reservation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": reservation.id,
            "booking_reference": reservation.booking_reference,

            "user_id": user.id,
            "customer_name": user.name,
            "customer_email": user.email,

            "event_id": event.id,
            "event_name": event.name,

            "ticket_type_id": ticket_type.id,
            "ticket_type_name": ticket_type.name,
            "ticket_price": ticket_type.price,

            "quantity": reservation.quantity,
            "total_price": ticket_type.price * reservation.quantity,

            "status": reservation.status,
            "expires_at": reservation.expires_at,
            "created_at": reservation.created_at
        }
        for reservation, user, ticket_type, event in results
    ]