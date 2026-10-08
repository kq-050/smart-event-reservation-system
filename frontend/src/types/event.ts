export interface Event {
  id: number;
  name: string;
  location: string;
  capacity: number;
  organizer_id: number;
}

export interface GetEventsQueryParams {
  search?: string;
  location?: string;
  skip?: number;
  limit?: number;
}

export interface EventCreatePayload {
  name: string;
  location: string;
  capacity: number;
}

export interface EventUpdatePayload {
  name: string;
  location: string;
  capacity: number;
}

export interface TicketAvailability {
  ticket_type_id: number;
  ticket_type_name: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface EventDetailsResponse extends Event {
  ticket_types: TicketAvailability[];
}

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface TicketTypeCreatePayload {
  name: string;
  price: number;
  quantity: number;
}

export interface TicketTypeAvailabilityResponse {
  ticket_type_id: number;
  ticket_type_name: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface EventTicketsResponse {
  event_id: number;
  event_name: string;
  ticket_types: TicketType[];
}
