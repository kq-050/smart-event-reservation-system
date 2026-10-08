import { apiClient } from './client';

import type {
  Event,
  EventDetailsResponse,
  GetEventsQueryParams,
  EventCreatePayload,
  EventUpdatePayload,
  TicketType,
  TicketTypeCreatePayload,
} from '../types';

/**
 * Fetch events list with search, location filter, and skip/limit pagination.
 * Endpoint: GET /events
 */
export async function getEvents(
  params?: GetEventsQueryParams
): Promise<Event[]> {
  const response = await apiClient.get<Event[]>('/events', {
    params: {
      search: params?.search || undefined,
      location: params?.location || undefined,
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 10,
    },
  });

  return response.data;
}

/**
 * Fetch a single event by ID.
 * Endpoint: GET /events/{event_id}
 */
export async function getEvent(
  eventId: number
): Promise<Event> {
  const response = await apiClient.get<Event>(
    `/events/${eventId}`
  );

  return response.data;
}

/**
 * Fetch detailed event information including real-time ticket availability.
 * Endpoint: GET /events/{event_id}/details
 */
export async function getEventDetails(
  eventId: number
): Promise<EventDetailsResponse> {
  const response =
    await apiClient.get<EventDetailsResponse>(
      `/events/${eventId}/details`
    );

  return response.data;
}

/**
 * Create a new event.
 * Endpoint: POST /events
 */
export async function createEvent(
  payload: EventCreatePayload
): Promise<Event> {
  const response = await apiClient.post<Event>(
    '/events',
    payload
  );

  return response.data;
}

/**
 * Update an existing event.
 * Endpoint: PUT /events/{event_id}
 */
export async function updateEvent(
  eventId: number,
  payload: EventUpdatePayload
): Promise<Event> {
  const response = await apiClient.put<Event>(
    `/events/${eventId}`,
    payload
  );

  return response.data;
}

/**
 * Delete an event.
 * Endpoint: DELETE /events/{event_id}
 */
export async function deleteEvent(
  eventId: number
): Promise<{ message: string }> {
  const response = await apiClient.delete<{
    message: string;
  }>(`/events/${eventId}`);

  return response.data;
}

/**
 * Create a ticket type for an event.
 * Endpoint: POST /events/{event_id}/ticket-types
 */
export async function createTicketType(
  eventId: number,
  payload: TicketTypeCreatePayload
): Promise<TicketType> {
  const response =
    await apiClient.post<TicketType>(
      `/events/${eventId}/ticket-types`,
      payload
    );

  return response.data;
}


export async function updateTicketType(
  ticketTypeId: number,
  payload: TicketTypeCreatePayload
): Promise<TicketType> {
  const response = await apiClient.put<TicketType>(
    `/ticket-types/${ticketTypeId}`,
    payload
  );
  return response.data;
}

export async function deleteTicketType(
  ticketTypeId: number
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/ticket-types/${ticketTypeId}`
  );
  return response.data;
}