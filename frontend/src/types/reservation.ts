export type ReservationStatus = 'active' | 'confirmed' | 'cancelled' | 'expired';

export interface Reservation {
  id: number;
  booking_reference: string;
  user_id: number;

  event_name: string;
  ticket_type_id: number;
  ticket_type_name: string;
  ticket_price: number;

  quantity: number;
  total_price: number;

  status: 'active' | 'confirmed' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface ReservationCreatePayload {
  ticket_type_id: number;
  quantity: number;
}
