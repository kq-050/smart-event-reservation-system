import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Save,
  XCircle,
  Ticket,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/common/Card';

import { Button } from '../../components/common/Button';

import {
  getEvent,
  updateEvent,
  getOrganizerEventTickets,
} from '../../api';

import type { Event } from '../../types';
import type { OrganizerEventTickets } from '../../api/organizer';

interface EventForm {
  name: string;
  location: string;
  capacity: string;
}

export const OrganizerEditEventPage: React.FC = () => {
  const params = useParams<{ eventId?: string; id?: string }>();
  const navigate = useNavigate();

  const eventId = params.eventId ?? params.id;
  const numericEventId = Number(eventId);

  const [eventData, setEventData] = React.useState<Event | null>(null);
  const [ticketData, setTicketData] =
    React.useState<OrganizerEventTickets | null>(null);

  const [form, setForm] = React.useState<EventForm>({
    name: '',
    location: '',
    capacity: '',
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
  let cancelled = false;

  const fetchEvent = async () => {
    if (!Number.isInteger(numericEventId) || numericEventId <= 0) {
      setError('Invalid event ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const event = await getEvent(numericEventId);

      if (cancelled) return;

      const tickets = await getOrganizerEventTickets(numericEventId);

      if (cancelled) return;

      setEventData(event);
      setTicketData(tickets);

      setForm({
        name: event.name,
        location: event.location,
        capacity: String(event.capacity),
      });
    } catch (err) {
      if (cancelled) return;

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load event.'
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchEvent();

  return () => {
    cancelled = true;
  };
}, [numericEventId]);

  const updateForm = (
    field: keyof EventForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const totalTicketQuantity =
    ticketData?.ticket_types.reduce(
      (total, ticket) => total + ticket.quantity,
      0
    ) ?? 0;

  const capacityNumber = Number(form.capacity);

  const remainingCapacity =
    Number.isInteger(capacityNumber) && capacityNumber > 0
      ? capacityNumber - totalTicketQuantity
      : 0;

  const handleSubmit = async (
    submitEvent: React.FormEvent<HTMLFormElement>
  ) => {
    submitEvent.preventDefault();

    setError(null);
    setSuccess(null);

    const capacity = Number(form.capacity);

    if (form.name.trim().length < 3) {
      setError(
        'Event name must be at least 3 characters long.'
      );
      return;
    }

    if (form.location.trim().length < 2) {
      setError(
        'Location must be at least 2 characters long.'
      );
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError(
        'Event capacity must be a positive whole number.'
      );
      return;
    }

    if (capacity < totalTicketQuantity) {
      setError(
        `Capacity cannot be reduced below the configured ticket quantity (${totalTicketQuantity}).`
      );
      return;
    }

    try {
      setSaving(true);

      const updatedEvent = await updateEvent(numericEventId, {
        name: form.name.trim(),
        location: form.location.trim(),
        capacity,
      });

      setEventData(updatedEvent);
      setSuccess('Event updated successfully.');

      setTimeout(() => {
        navigate('/organizer/events');
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update event.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge badge-organizer-wrap">
            <Calendar size={14} />
            <span>Event Management</span>
          </div>

          <h1 className="page-title">Edit Event</h1>

          <p className="page-description">
            Loading event details...
          </p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="page-container">
        <div className="mb-4">
          <Link to="/organizer/events">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
            >
              Back to Managed Events
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent>
            <div className="placeholder-banner">
              <XCircle size={24} />

              <div>
                <p>{error || 'Event not found.'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-4">
        <Link to="/organizer/events">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Managed Events
          </Button>
        </Link>
      </div>

      <div className="page-header">
        <div className="page-badge badge-organizer-wrap">
          <Calendar size={14} />
          <span>Event Management</span>
        </div>

        <h1 className="page-title">Edit Event</h1>

        <p className="page-description">
          Update the details for{' '}
          <strong>{eventData.name}</strong>.
        </p>
      </div>

      {error && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <XCircle size={22} />

              <div>
                <p>{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <Save size={22} />

              <div>
                <p>{success}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="placeholder-card mt-4">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>

          <CardDescription>
            Update the basic information for your event.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label
                  htmlFor="event-name"
                  className="form-label"
                >
                  Event Name
                </label>

                <input
                  id="event-name"
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      'name',
                      event.target.value
                    )
                  }
                  minLength={3}
                  maxLength={200}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="event-location"
                  className="form-label"
                >
                  Location
                </label>

                <input
                  id="event-location"
                  type="text"
                  className="form-input"
                  value={form.location}
                  onChange={(event) =>
                    updateForm(
                      'location',
                      event.target.value
                    )
                  }
                  minLength={2}
                  maxLength={200}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="event-capacity"
                  className="form-label"
                >
                  Event Capacity
                </label>

                <input
                  id="event-capacity"
                  type="number"
                  className="form-input"
                  value={form.capacity}
                  onChange={(event) =>
                    updateForm(
                      'capacity',
                      event.target.value
                    )
                  }
                  min={1}
                  step={1}
                  disabled={saving}
                  required
                />

                <p className="stat-subtext">
                  Current ticket configuration uses{' '}
                  <strong>
                    {totalTicketQuantity.toLocaleString()}
                  </strong>{' '}
                  tickets.
                </p>
              </div>
            </div>

            <div className="quick-nav-box mt-4">
              <div className="flex-header">
                <div>
                  <p className="quick-nav-title">
                    Capacity Overview
                  </p>

                  <p className="stat-subtext">
                    {totalTicketQuantity.toLocaleString()}{' '}
                    tickets configured
                  </p>
                </div>

                <div>
                  <p className="stat-value">
                    {remainingCapacity >= 0
                      ? remainingCapacity.toLocaleString()
                      : 0}
                  </p>

                  <p className="stat-subtext">
                    Remaining Capacity
                  </p>
                </div>
              </div>
            </div>

            <div className="button-group-wrap mt-4">
              <Button
                type="submit"
                leftIcon={<Save size={16} />}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>

              <Link to="/organizer/events">
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<ArrowLeft size={16} />}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="placeholder-card mt-4">
        <CardHeader>
          <CardTitle>
            Current Ticket Configuration
          </CardTitle>

          <CardDescription>
            Ticket types currently attached to this event.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {ticketData?.ticket_types.length ? (
            <div className="button-group-wrap">
              {ticketData.ticket_types.map((ticket) => (
                <div
                  key={ticket.id}
                  className="quick-nav-box"
                >
                  <div className="flex-header">
                    <div>
                      <p className="quick-nav-title">
                        {ticket.name}
                      </p>

                      <p className="stat-subtext">
                        <Ticket size={13} />{' '}
                        {ticket.quantity.toLocaleString()}{' '}
                        tickets
                      </p>
                    </div>

                    <div>
                      <p className="stat-value">
                        ${ticket.price.toLocaleString()}
                      </p>

                      <p className="stat-subtext">
                        Ticket Price
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder-banner">
              <Ticket size={22} />

              <div>
                <p>
                  No ticket types are configured for this
                  event yet.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizerEditEventPage;

