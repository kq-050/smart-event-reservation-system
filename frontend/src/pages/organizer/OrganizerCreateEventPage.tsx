import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ArrowLeft,
  Trash2,
  Save,
  XCircle,
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
  createEvent,
  createTicketType,
} from '../../api';

interface TicketDraft {
  id: number;
  name: string;
  price: string;
  quantity: string;
}

interface EventForm {
  name: string;
  location: string;
  capacity: string;
}

const createEmptyTicket = (id: number): TicketDraft => ({
  id,
  name: '',
  price: '',
  quantity: '',
});

export const OrganizerCreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = React.useState<EventForm>({
    name: '',
    location: '',
    capacity: '',
  });

  const [tickets, setTickets] = React.useState<
    TicketDraft[]
  >([createEmptyTicket(1)]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    null
  );

  const updateForm = (
    field: keyof EventForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateTicket = (
    ticketId: number,
    field: keyof Omit<TicketDraft, 'id'>,
    value: string
  ) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              [field]: value,
            }
          : ticket
      )
    );
  };

  const addTicket = () => {
    const nextId =
      tickets.length > 0
        ? Math.max(...tickets.map((ticket) => ticket.id)) + 1
        : 1;

    setTickets((current) => [
      ...current,
      createEmptyTicket(nextId),
    ]);
  };

  const removeTicket = (ticketId: number) => {
    setTickets((current) =>
      current.filter((ticket) => ticket.id !== ticketId)
    );
  };

  const totalTicketQuantity = tickets.reduce(
    (total, ticket) => {
      const quantity = Number(ticket.quantity);

      return total + (Number.isFinite(quantity) ? quantity : 0);
    },
    0
  );

  const capacityNumber = Number(form.capacity);

  const remainingCapacity =
    Number.isFinite(capacityNumber) &&
    capacityNumber > 0
      ? capacityNumber - totalTicketQuantity
      : 0;

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(null);

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

    const validTickets = tickets.filter(
      (ticket) =>
        ticket.name.trim() !== '' ||
        ticket.price !== '' ||
        ticket.quantity !== ''
    );

    for (const ticket of validTickets) {
      const price = Number(ticket.price);
      const quantity = Number(ticket.quantity);

      if (ticket.name.trim().length < 2) {
        setError(
          'Each ticket type must have a name of at least 2 characters.'
        );
        return;
      }

      if (!Number.isInteger(price) || price < 0) {
        setError(
          `Invalid price for "${ticket.name}". Price must be 0 or greater.`
        );
        return;
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError(
          `Invalid quantity for "${ticket.name}". Quantity must be greater than 0.`
        );
        return;
      }
    }

    if (totalTicketQuantity > capacity) {
      setError(
        `Ticket quantity (${totalTicketQuantity}) cannot exceed event capacity (${capacity}).`
      );
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create the event.
      const createdEvent = await createEvent({
        name: form.name.trim(),
        location: form.location.trim(),
        capacity,
      });

      // Step 2: Create ticket types.
      for (const ticket of validTickets) {
        await createTicketType(createdEvent.id, {
          name: ticket.name.trim(),
          price: Number(ticket.price),
          quantity: Number(ticket.quantity),
        });
      }

      // Step 3: Return to the organizer's event list.
      navigate('/organizer/events');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create the event.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Back button */}
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

      {/* Header */}
      <div className="page-header">
        <div className="page-badge badge-organizer-wrap">
          <PlusCircle size={14} />
          <span>New Event</span>
        </div>

        <h1 className="page-title">
          Create New Event
        </h1>

        <p className="page-description">
          Set up your event and configure its ticket types.
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <XCircle
                size={24}
                className="text-muted"
              />

              <div>
                <p>{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Event details */}
        <Card className="placeholder-card mt-4">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>

            <CardDescription>
              Basic information about your event.
            </CardDescription>
          </CardHeader>

          <CardContent>
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
                  placeholder="e.g. Python Developer Conference"
                  minLength={3}
                  maxLength={200}
                  required
                  disabled={loading}
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
                  placeholder="e.g. Islamabad Convention Center"
                  minLength={2}
                  maxLength={200}
                  required
                  disabled={loading}
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
                  placeholder="500"
                  min={1}
                  step={1}
                  required
                  disabled={loading}
                />

                <p className="stat-subtext">
                  Maximum number of tickets that can be
                  configured across all ticket types.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket types */}
        <Card className="placeholder-card mt-4">
          <CardHeader>
            <div className="flex-header">
              <div>
                <CardTitle>
                  Ticket Types
                </CardTitle>

                <CardDescription>
                  Configure the ticket tiers available
                  for this event.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<PlusCircle size={14} />}
                onClick={addTicket}
                disabled={loading}
              >
                Add Ticket Type
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="ticket-cards-grid">
              {tickets.map((ticket, index) => (
                <Card
                  key={ticket.id}
                  className="ticket-tier-draft-card mb-4"
                >
                  <CardHeader>
                    <div className="flex-header">
                      <div>
                        <CardTitle>
                          Ticket Type {index + 1}
                        </CardTitle>

                        <CardDescription>
                          Set the name, price, and available
                          quantity.
                        </CardDescription>
                      </div>

                      {tickets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeTicket(ticket.id)
                          }
                          disabled={loading}
                          leftIcon={
                            <Trash2 size={14} />
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="form-grid">
                      <div className="form-group">
                        <label
                          htmlFor={`ticket-name-${ticket.id}`}
                          className="form-label"
                        >
                          Ticket Name
                        </label>

                        <input
                          id={`ticket-name-${ticket.id}`}
                          type="text"
                          className="form-input"
                          value={ticket.name}
                          onChange={(event) =>
                            updateTicket(
                              ticket.id,
                              'name',
                              event.target.value
                            )
                          }
                          placeholder="e.g. General Admission"
                          minLength={2}
                          maxLength={100}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label
                          htmlFor={`ticket-price-${ticket.id}`}
                          className="form-label"
                        >
                          Price
                        </label>

                        <input
                          id={`ticket-price-${ticket.id}`}
                          type="number"
                          className="form-input"
                          value={ticket.price}
                          onChange={(event) =>
                            updateTicket(
                              ticket.id,
                              'price',
                              event.target.value
                            )
                          }
                          placeholder="99"
                          min={0}
                          step={1}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label
                          htmlFor={`ticket-quantity-${ticket.id}`}
                          className="form-label"
                        >
                          Quantity
                        </label>

                        <input
                          id={`ticket-quantity-${ticket.id}`}
                          type="number"
                          className="form-input"
                          value={ticket.quantity}
                          onChange={(event) =>
                            updateTicket(
                              ticket.id,
                              'quantity',
                              event.target.value
                            )
                          }
                          placeholder="400"
                          min={1}
                          step={1}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Capacity summary */}
            <div className="quick-nav-box mt-4">
              <div className="flex-header">
                <div>
                  <p className="quick-nav-title">
                    Ticket Capacity
                  </p>

                  <p className="stat-subtext">
                    {totalTicketQuantity.toLocaleString()}{' '}
                    tickets configured
                    {Number.isFinite(capacityNumber) &&
                      capacityNumber > 0 &&
                      ` out of ${capacityNumber.toLocaleString()}`}
                  </p>
                </div>

                <div>
                  <p className="stat-value">
                    {remainingCapacity >= 0
                      ? remainingCapacity.toLocaleString()
                      : 0}
                  </p>

                  <p className="stat-subtext">
                    Remaining
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="mt-4">
          <Button
            type="submit"
            leftIcon={<Save size={16} />}
            disabled={loading}
          >
            {loading
              ? 'Creating Event...'
              : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrganizerCreateEventPage;