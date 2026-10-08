import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, ArrowRight, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import type { Event, EventDetailsResponse } from '../../types';

export interface EventCardProps {
  event: Event | EventDetailsResponse;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, className = '' }) => {
  // Check if ticket_types availability detail is present
  const ticketTypes = 'ticket_types' in event ? event.ticket_types : undefined;
  const totalAvailable = ticketTypes
    ? ticketTypes.reduce((acc, tt) => acc + tt.available_quantity, 0)
    : undefined;

  return (
    <Card hoverable className={`event-card ${className}`.trim()}>
      <CardHeader>
        <div className="event-card-top flex-between mb-2">
          <span className="route-badge badge-public">
            <Calendar size={12} className="inline-icon mr-1" />
            Event #{event.id}
          </span>
          {totalAvailable !== undefined && (
            <span className={`status-badge ${totalAvailable > 0 ? 'badge-user' : 'badge-danger'}`}>
              {totalAvailable > 0 ? `${totalAvailable} Tickets Left` : 'Sold Out'}
            </span>
          )}
        </div>
        <CardTitle className="event-title text-lg font-bold">{event.name}</CardTitle>
      </CardHeader>

      <CardContent className="event-card-body">
        <div className="event-meta-list">
          <div className="event-meta-item">
            <MapPin size={16} className="meta-icon text-primary" />
            <span className="meta-text">{event.location}</span>
          </div>
          <div className="event-meta-item">
            <Users size={16} className="meta-icon text-muted" />
            <span className="meta-text">Total Capacity: <strong>{event.capacity}</strong> attendees</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="event-card-footer flex-between">
        <span className="text-xs text-muted">Organizer #{event.organizer_id}</span>
        <Link to={`/events/${event.id}`}>
          <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
            View Event
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
