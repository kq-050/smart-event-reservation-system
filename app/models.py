from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, CheckConstraint, Index
from .database import Base, utc_now


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("capacity > 0", name="chk_event_capacity_positive"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)

    organizer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'organizer')", name="chk_user_role_valid"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    created_at = Column(DateTime, default=utc_now)


class TicketType(Base):
    __tablename__ = "ticket_types"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_ticket_type_quantity_positive"),
        CheckConstraint("price >= 0", name="chk_ticket_type_price_non_negative"),
    )

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(
        Integer,
        ForeignKey("events.id"),
        nullable=False,
        index=True
    )

    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_reservation_quantity_positive"),
        CheckConstraint(
            "status IN ('active', 'confirmed', 'cancelled', 'expired')",
            name="chk_reservation_status_valid"
        ),
        Index("ix_reservations_status_expires_at", "status", "expires_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    ticket_type_id = Column(
        Integer,
        ForeignKey("ticket_types.id"),
        nullable=False,
        index=True
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="active",
        index=True
    )

    expires_at = Column(
        DateTime,
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime,
        default=utc_now
    )