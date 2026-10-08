from datetime import timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session

from .. import models
from ..auth import get_current_user
from ..database import get_db, utc_now
from ..schemas import ReservationCreate, ReservationResponse
from ..limiter import limiter


router = APIRouter(
    prefix="",
    tags=["Reservations & Bookings"]
)


def build_reservation_response(
    reservation: models.Reservation,
    db: Session
) -> ReservationResponse:
    ticket_type = (
        db.query(models.TicketType)
        .filter(models.TicketType.id == reservation.ticket_type_id)
        .first()
    )

    if not ticket_type:
        raise HTTPException(
            status_code=404,
            detail="Ticket type not found"
        )

    event = (
        db.query(models.Event)
        .filter(models.Event.id == ticket_type.event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return ReservationResponse(
        id=reservation.id,
        booking_reference=reservation.booking_reference,
        user_id=reservation.user_id,
        event_name=event.name,
        ticket_type_name=ticket_type.name,
        ticket_price=ticket_type.price,
        ticket_type_id=reservation.ticket_type_id,
        quantity=reservation.quantity,
        total_price=ticket_type.price * reservation.quantity,
        status=reservation.status,
        expires_at=reservation.expires_at,
        created_at=reservation.created_at,
    )


@router.post(
    "/reservations",
    response_model=ReservationResponse,
    status_code=201
)
@limiter.limit("10/minute")
def create_reservation(
    request: Request,
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ticket_type = (
        db.query(models.TicketType)
        .filter(models.TicketType.id == reservation.ticket_type_id)
        .with_for_update()
        .first()
    )

    if not ticket_type:
        raise HTTPException(
            status_code=404,
            detail="Ticket type not found"
        )

    now = utc_now()

    active_and_confirmed = db.query(models.Reservation).filter(
        models.Reservation.ticket_type_id == reservation.ticket_type_id,
        (
            (models.Reservation.status == "confirmed") |
            (
                (models.Reservation.status == "active") &
                (models.Reservation.expires_at > now)
            )
        )
    ).all()

    reserved_quantity = sum(
        item.quantity for item in active_and_confirmed
    )

    available_quantity = ticket_type.quantity - reserved_quantity

    if reservation.quantity > available_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available_quantity} tickets available"
        )

    expires_at = now + timedelta(minutes=10)

    booking_reference = (
        f"EVT-{uuid.uuid4().hex[:8].upper()}"
    )

    new_reservation = models.Reservation(
        booking_reference=booking_reference,
        user_id=current_user.id,
        ticket_type_id=reservation.ticket_type_id,
        quantity=reservation.quantity,
        status="active",
        expires_at=expires_at
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    return build_reservation_response(new_reservation, db)


@router.get(
    "/reservations/my",
    response_model=list[ReservationResponse]
)
def get_my_reservations(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservations = (
        db.query(models.Reservation)
        .filter(models.Reservation.user_id == current_user.id)
        .order_by(models.Reservation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        build_reservation_response(reservation, db)
        for reservation in reservations
    ]


@router.put(
    "/reservations/{reservation_id}/cancel",
    response_model=ReservationResponse
)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservation = (
        db.query(models.Reservation)
        .filter(models.Reservation.id == reservation_id)
        .with_for_update()
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found"
        )

    if reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only cancel your own reservations"
        )

    if reservation.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Only active reservations can be cancelled"
        )

    reservation.status = "cancelled"

    db.commit()
    db.refresh(reservation)

    return build_reservation_response(reservation, db)


@router.put(
    "/reservations/{reservation_id}/confirm",
    response_model=ReservationResponse
)
def confirm_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reservation = (
        db.query(models.Reservation)
        .filter(models.Reservation.id == reservation_id)
        .with_for_update()
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found"
        )

    if reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only confirm your own reservations"
        )

    if reservation.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Only active reservations can be confirmed"
        )

    if reservation.expires_at <= utc_now():
        reservation.status = "expired"
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Reservation has expired"
        )

    reservation.status = "confirmed"

    db.commit()
    db.refresh(reservation)

    return build_reservation_response(reservation, db)


@router.get(
    "/bookings/my",
    response_model=list[ReservationResponse]
)
def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bookings = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.user_id == current_user.id,
            models.Reservation.status == "confirmed"
        )
        .order_by(models.Reservation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        build_reservation_response(booking, db)
        for booking in bookings
    ]


@router.get(
    "/bookings/{booking_reference}",
    response_model=ReservationResponse
)
def get_booking_by_reference(
    booking_reference: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.booking_reference == booking_reference,
            models.Reservation.user_id == current_user.id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return build_reservation_response(booking, db)