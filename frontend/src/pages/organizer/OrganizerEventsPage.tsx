import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  PlusCircle,
  Edit,
  Ticket,
  MapPin,
  Users,
  RefreshCw,
  XCircle,
  ArrowRight,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/common/Card';

import { Button } from '../../components/common/Button';

import {
  getOrganizerEvents,
  getOrganizerEventTickets,
} from '../../api';

import type {
  OrganizerEvent,
  OrganizerEventTickets,
} from '../../api/organizer';

interface EventWithTickets {
  event: OrganizerEvent;
  tickets: OrganizerEventTickets | null;
}

export const OrganizerEventsPage: React.FC = () => {
  const [events, setEvents] = React.useState<EventWithTickets[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const organizerEvents = await getOrganizerEvents();

      const eventsWithTickets = await Promise.all(
        organizerEvents.map(async (event) => {
          try {
            const tickets = await getOrganizerEventTickets(event.id);

            return {
              event,
              tickets,
            };
          } catch {
            return {
              event,
              tickets: null,
            };
          }
        })
      );

      setEvents(eventsWithTickets);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load your events.'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const organizerEvents = await getOrganizerEvents();

        const eventsWithTickets = await Promise.all(
          organizerEvents.map(async (event) => {
            try {
              const tickets =
                await getOrganizerEventTickets(event.id);

              return {
                event,
                tickets,
              };
            } catch {
              return {
                event,
                tickets: null,
              };
            }
          })
        );

        setEvents(eventsWithTickets);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load your events.'
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchEvents();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex-header">
        <div>
          <div className="page-badge badge-organizer-wrap">
            <Calendar size={14} />
            <span>Organizer Management</span>
          </div>

          <h1 className="page-title">My Managed Events</h1>

          <p className="page-description">
            View and manage the events hosted by your organizer
            account.
          </p>
        </div>

        <div>
          <Link to="/organizer/events/new">
            <Button leftIcon={<PlusCircle size={16} />}>
              Add New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Subnavigation */}
      <div className="subnav-bar">
        <Link
          to="/organizer"
          className="subnav-link"
        >
          Dashboard Overview
        </Link>

        <Link
          to="/organizer/events"
          className="subnav-link subnav-active"
        >
          My Events
        </Link>

        <Link
          to="/organizer/events/new"
          className="subnav-link"
        >
          Create Event
        </Link>

        <Link
          to="/organizer/reservations"
          className="subnav-link"
        >
          Reservation Queue
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <RefreshCw
                size={24}
                className="text-muted"
              />

              <p>Loading your events...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <XCircle
                size={24}
                className="text-muted"
              />

              <div>
                <p>{error}</p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadEvents()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <Calendar
                size={32}
                className="text-muted"
              />

              <div>
                <h3>No events yet</h3>

                <p>
                  You have not created any events. Create your
                  first event to start accepting reservations.
                </p>

                <Link to="/organizer/events/new">
                  <Button
                    leftIcon={<PlusCircle size={16} />}
                  >
                    Create Your First Event
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events */}
      {!loading && !error && events.length > 0 && (
        <div className="placeholder-content">
          <div className="stats-preview-grid">
            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Calendar size={20} />
                </div>

                <p className="stat-label">
                  Your Events
                </p>

                <h3 className="stat-value">
                  {events.length}
                </h3>

                <p className="stat-subtext">
                  Events managed by your account
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Ticket size={20} />
                </div>

                <p className="stat-label">
                  Ticket Types
                </p>

                <h3 className="stat-value">
                  {events.reduce(
                    (total, item) =>
                      total +
                      (item.tickets?.ticket_types.length ?? 0),
                    0
                  )}
                </h3>

                <p className="stat-subtext">
                  Across all your events
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Users size={20} />
                </div>

                <p className="stat-label">
                  Total Capacity
                </p>

                <h3 className="stat-value">
                  {events
                    .reduce(
                      (total, item) =>
                        total + item.event.capacity,
                      0
                    )
                    .toLocaleString()}
                </h3>

                <p className="stat-subtext">
                  Combined event capacity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Event cards */}
          <div className="organizer-events-grid mt-4">
            {events.map(({ event, tickets }) => {
              const ticketTypes =
                tickets?.ticket_types ?? [];

              const totalTickets = ticketTypes.reduce(
                (total, ticket) =>
                  total + ticket.quantity,
                0
              );

              return (
                <Card
                  key={event.id}
                  className="organizer-event-management-card"
                >
                  <CardHeader>
                    <div className="flex-between">
                      <div>
                        <CardTitle>
                          {event.name}
                        </CardTitle>

                        <CardDescription>
                          Event ID: #{event.id}
                        </CardDescription>
                      </div>

                      <span className="route-badge badge-public">
                        Active Event
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Event information */}
                    <div className="organizer-event-meta-grid mb-4">
                      <div className="meta-chip">
                        <MapPin size={15} className="text-primary meta-chip-icon" />
                        <div>
                          <span className="text-xs text-muted block">Location</span>
                          <strong className="text-sm">{event.location}</strong>
                        </div>
                      </div>

                      <div className="meta-chip">
                        <Users size={15} className="text-primary meta-chip-icon" />
                        <div>
                          <span className="text-xs text-muted block">Capacity</span>
                          <strong className="text-sm">{event.capacity.toLocaleString()} seats</strong>
                        </div>
                      </div>

                      <div className="meta-chip">
                        <Ticket size={15} className="text-primary meta-chip-icon" />
                        <div>
                          <span className="text-xs text-muted block">Tiers Configured</span>
                          <strong className="text-sm">{ticketTypes.length} ticket tiers</strong>
                        </div>
                      </div>

                      <div className="meta-chip">
                        <Calendar size={15} className="text-primary meta-chip-icon" />
                        <div>
                          <span className="text-xs text-muted block">Total Inventory</span>
                          <strong className="text-sm">{totalTickets.toLocaleString()} tickets</strong>
                        </div>
                      </div>
                    </div>

                    {/* Ticket types summary */}
                    <div className="ticket-tiers-summary-box mb-2">
                      <p className="stat-label mb-2">
                        Configured Ticket Tiers
                      </p>

                      {ticketTypes.length === 0 ? (
                        <p className="text-xs text-muted italic">
                          No ticket types configured yet. Add tickets to accept reservations.
                        </p>
                      ) : (
                        <div className="tier-pills-wrap">
                          {ticketTypes.map((ticket) => (
                            <span
                              key={ticket.id}
                              className="tier-pill"
                            >
                              <strong>{ticket.name}</strong>
                              <span className="tier-pill-detail">
                                ${ticket.price.toLocaleString()} · {ticket.quantity.toLocaleString()} qty
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex-between flex-wrap gap-2">
                    <div className="flex-center gap-2">
                      <Link to={`/organizer/events/${event.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit size={14} />}
                        >
                          Edit Details
                        </Button>
                      </Link>

                      <Link to={`/organizer/events/${event.id}/tickets`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Ticket size={14} />}
                        >
                          Manage Tickets
                        </Button>
                      </Link>
                    </div>

                    <Link to={`/events/${event.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ArrowRight size={14} />}
                      >
                        Public Page
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerEventsPage;