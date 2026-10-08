from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class EventCreate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    location: str = Field(min_length=2, max_length=200)
    capacity: int = Field(gt=0)


class EventUpdate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    location: str = Field(min_length=2, max_length=200)
    capacity: int = Field(gt=0)


class EventResponse(BaseModel):
    id: int
    name: str
    location: str
    capacity: int
    organizer_id: int

    model_config = ConfigDict(from_attributes=True)
        
        
        
class TicketTypeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    price: int = Field(ge=0)
    quantity: int = Field(gt=0)


class TicketTypeResponse(BaseModel):
    id: int
    event_id: int
    name: str
    price: int
    quantity: int

    model_config = ConfigDict(from_attributes=True)
        

class ReservationCreate(BaseModel):
    ticket_type_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class ReservationResponse(BaseModel):
    id: int
    booking_reference: str
    user_id: int

    event_name: str
    ticket_type_id: int
    ticket_type_name: str
    ticket_price: int

    quantity: int
    total_price: int
    status: str
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketAvailability(BaseModel):
    ticket_type_id: int
    ticket_type_name: str
    total_quantity: int
    reserved_quantity: int
    available_quantity: int


class EventDetailsResponse(BaseModel):
    id: int
    name: str
    location: str
    capacity: int
    organizer_id: int
    ticket_types: list[TicketAvailability]
    

class OrganizerReservationResponse(BaseModel):
    id: int
    booking_reference: str

    user_id: int
    customer_name: str
    customer_email: str

    event_id: int
    event_name: str

    ticket_type_id: int
    ticket_type_name: str
    ticket_price: int

    quantity: int
    total_price: int

    status: str
    expires_at: datetime
    created_at: datetime
    

class OrganizerEventStats(BaseModel):
    event_id: int
    event_name: str
    capacity: int
    total_ticket_types: int
    total_tickets: int
    tickets_sold: int
    tickets_available: int
    total_reservations: int
    confirmed_bookings: int
    active_reservations: int
    cancelled_reservations: int
    expired_reservations: int
    total_revenue: int


class OrganizerDashboardResponse(BaseModel):
    total_events: int
    total_ticket_types: int
    total_reservations: int
    confirmed_bookings: int
    active_reservations: int
    cancelled_reservations: int
    expired_reservations: int
    total_tickets_sold: int
    total_revenue: int
    events: list[OrganizerEventStats]