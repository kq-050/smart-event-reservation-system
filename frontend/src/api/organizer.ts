import { apiClient } from './client';

export interface OrganizerEventStats {
  event_id: number;
  event_name: string;
  capacity: number;
  total_ticket_types: number;
  total_tickets: number;
  tickets_sold: number;
  tickets_available: number;
  total_reservations: number;
  confirmed_bookings: number;
  active_reservations: number;
  cancelled_reservations: number;
  expired_reservations: number;
  total_revenue: number;
}

export interface OrganizerDashboard {
  total_events: number;
  total_ticket_types: number;
  total_reservations: number;
  confirmed_bookings: number;
  active_reservations: number;
  cancelled_reservations: number;
  expired_reservations: number;
  total_tickets_sold: number;
  total_revenue: number;
  events: OrganizerEventStats[];
}

/**
 * Fetch organizer dashboard statistics.
 * Endpoint: GET /organizer/dashboard
 */
export async function getOrganizerDashboard(): Promise<OrganizerDashboard> {
  const response = await apiClient.get<OrganizerDashboard>(
    '/organizer/dashboard'
  );

  return response.data;
}


// --------------------------------------------------
// Organizer Events
// --------------------------------------------------

export interface OrganizerEvent {
  id: number;
  name: string;
  location: string;
  capacity: number;
  organizer_id: number;
}

export interface OrganizerTicketType {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface OrganizerEventTickets {
  event_id: number;
  event_name: string;
  ticket_types: OrganizerTicketType[];
}

/**
 * Fetch events belonging to the logged-in organizer.
 * Endpoint: GET /organizer/events
 */
export async function getOrganizerEvents(
  skip = 0,
  limit = 100
): Promise<OrganizerEvent[]> {
  const response = await apiClient.get<OrganizerEvent[]>(
    '/organizer/events',
    {
      params: {
        skip,
        limit,
      },
    }
  );

  return response.data;
}

/**
 * Fetch ticket types for one organizer-owned event.
 * Endpoint: GET /organizer/events/{event_id}/tickets
 */
export async function getOrganizerEventTickets(
  eventId: number
): Promise<OrganizerEventTickets> {
  const response = await apiClient.get<OrganizerEventTickets>(
    `/organizer/events/${eventId}/tickets`
  );

  return response.data;
}

export type OrganizerReservationStatus =
  | 'active'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

export interface OrganizerReservation {
  id: number;
  booking_reference: string;
  user_id: number;
  customer_name: string;
  customer_email: string;
  event_id: number;
  event_name: string;
  ticket_type_id: number;
  ticket_type_name: string;
  ticket_price: number;
  quantity: number;
  total_price: number;
  status: OrganizerReservationStatus;
  expires_at: string;
  created_at: string;
}

export async function getOrganizerReservations(
  status?: OrganizerReservationStatus,
  skip = 0,
  limit = 10
): Promise<OrganizerReservation[]> {
  const response = await apiClient.get<OrganizerReservation[]>(
    '/organizer/reservations',
    {
      params: {
        status: status || undefined,
        skip,
        limit,
      },
    }
  );

  return response.data;
}