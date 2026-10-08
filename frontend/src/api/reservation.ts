import client from './client';
import type {
  Reservation,
  ReservationCreatePayload,
} from '../types/reservation';

export const createReservation = async (
  payload: ReservationCreatePayload
): Promise<Reservation> => {
  const response = await client.post<Reservation>('/reservations', payload);
  return response.data;
};

export const getMyReservations = async (): Promise<Reservation[]> => {
  const response = await client.get<Reservation[]>('/reservations/my');
  return response.data;
};

export const cancelReservation = async (
  reservationId: number
): Promise<Reservation> => {
  const response = await client.put<Reservation>(
    `/reservations/${reservationId}/cancel`
  );
  return response.data;
};

export const confirmReservation = async (
  reservationId: number
): Promise<Reservation> => {
  const response = await client.put<Reservation>(
    `/reservations/${reservationId}/confirm`
  );
  return response.data;
};

export const getMyBookings = async (): Promise<Reservation[]> => {
  const response = await client.get<Reservation[]>('/bookings/my');
  return response.data;
};

export const getBookingByReference = async (
  bookingReference: string
): Promise<Reservation> => {
  const response = await client.get<Reservation>(
    `/bookings/${bookingReference}`
  );
  return response.data;
};