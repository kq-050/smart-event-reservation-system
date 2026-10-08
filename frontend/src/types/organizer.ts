import type { ReservationStatus } from './reservation';

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
  status: ReservationStatus;
  expires_at: string;
  created_at: string;
}

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

export interface OrganizerDashboardResponse {
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
