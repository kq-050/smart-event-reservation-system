import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ticket,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
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
  getOrganizerEventTickets,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from '../../api';

import type { OrganizerEventTickets } from '../../api/organizer';

interface TicketForm {
  name: string;
  price: string;
  quantity: string;
}

const emptyForm: TicketForm = {
  name: '',
  price: '',
  quantity: '',
};

export const OrganizerManageTicketsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const numericEventId = Number(eventId);

  const [eventData, setEventData] =
    React.useState<OrganizerEventTickets | null>(null);

  const [form, setForm] = React.useState<TicketForm>(emptyForm);

  const [editingTicketId, setEditingTicketId] =
    React.useState<number | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] =
    React.useState<number | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!Number.isInteger(numericEventId) || numericEventId <= 0) {
        setError('Invalid event ID.');
        return;
      }

      const data = await getOrganizerEventTickets(numericEventId);
      setEventData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load ticket types.'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!Number.isInteger(numericEventId) || numericEventId <= 0) {
          setError('Invalid event ID.');
          return;
        }

        const data = await getOrganizerEventTickets(numericEventId);
        setEventData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load ticket types.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [numericEventId]);

  const updateForm = (
    field: keyof TicketForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingTicketId(null);
  };

  const startEditing = (
    ticketId: number,
    name: string,
    price: number,
    quantity: number
  ) => {
    setEditingTicketId(ticketId);

    setForm({
      name,
      price: String(price),
      quantity: String(quantity),
    });

    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (
    submitEvent: React.FormEvent<HTMLFormElement>
  ) => {
    submitEvent.preventDefault();

    setError(null);
    setSuccess(null);

    const price = Number(form.price);
    const quantity = Number(form.quantity);

    if (form.name.trim().length < 2) {
      setError(
        'Ticket name must be at least 2 characters long.'
      );
      return;
    }

    if (!Number.isInteger(price) || price < 0) {
      setError('Price must be 0 or greater.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    try {
      setSaving(true);

      if (editingTicketId !== null) {
        await updateTicketType(editingTicketId, {
          name: form.name.trim(),
          price,
          quantity,
        });

        setSuccess('Ticket type updated successfully.');
      } else {
        await createTicketType(numericEventId, {
          name: form.name.trim(),
          price,
          quantity,
        });

        setSuccess('Ticket type created successfully.');
      }

      resetForm();
      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save ticket type.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticketId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this ticket type?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(ticketId);
      setError(null);
      setSuccess(null);

      await deleteTicketType(ticketId);

      setSuccess('Ticket type deleted successfully.');

      if (editingTicketId === ticketId) {
        resetForm();
      }

      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete ticket type.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totalTickets =
    eventData?.ticket_types.reduce(
      (total, ticket) => total + ticket.quantity,
      0
    ) ?? 0;


  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge badge-organizer-wrap">
            <Ticket size={14} />
            <span>Ticket Management</span>
          </div>

          <h1 className="page-title">Manage Tickets</h1>

          <p className="page-description">
            Loading ticket types...
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
              <AlertCircle size={24} />
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
          <Ticket size={14} />
          <span>Ticket Management</span>
        </div>

        <h1 className="page-title">
          Manage Tickets
        </h1>

        <p className="page-description">
          Configure ticket types for{' '}
          <strong>{eventData.event_name}</strong>.
        </p>
      </div>

      {error && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <AlertCircle size={22} />
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

      <div className="stats-grid mt-4">
        <Card className="stat-card">
          <CardContent>
            <p className="stat-label">Ticket Types</p>
            <p className="stat-value">
              {eventData.ticket_types.length}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <p className="stat-label">Tickets Configured</p>
            <p className="stat-value">
              {totalTickets.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <p className="stat-label">Event ID</p>
            <p className="stat-value">
              #{eventData.event_id}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="placeholder-card mt-4">
        <CardHeader>
          <CardTitle>
            {editingTicketId !== null
              ? 'Edit Ticket Type'
              : 'Add Ticket Type'}
          </CardTitle>

          <CardDescription>
            {editingTicketId !== null
              ? 'Update the selected ticket type.'
              : 'Create a new ticket tier for this event.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label
                  htmlFor="ticket-name"
                  className="form-label"
                >
                  Ticket Name
                </label>

                <input
                  id="ticket-name"
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(event) =>
                    updateForm('name', event.target.value)
                  }
                  placeholder="e.g. VIP Pass"
                  minLength={2}
                  maxLength={100}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="ticket-price"
                  className="form-label"
                >
                  Price
                </label>

                <input
                  id="ticket-price"
                  type="number"
                  className="form-input"
                  value={form.price}
                  onChange={(event) =>
                    updateForm('price', event.target.value)
                  }
                  placeholder="299"
                  min={0}
                  step={1}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="ticket-quantity"
                  className="form-label"
                >
                  Quantity
                </label>

                <input
                  id="ticket-quantity"
                  type="number"
                  className="form-input"
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm(
                      'quantity',
                      event.target.value
                    )
                  }
                  placeholder="100"
                  min={1}
                  step={1}
                  disabled={saving}
                  required
                />
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
                  : editingTicketId !== null
                    ? 'Update Ticket Type'
                    : 'Add Ticket Type'}
              </Button>

              {editingTicketId !== null && (
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<X size={16} />}
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="placeholder-card mt-4">
        <CardHeader>
          <CardTitle>Existing Ticket Types</CardTitle>

          <CardDescription>
            Manage the ticket tiers currently configured for
            this event.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {eventData.ticket_types.length === 0 ? (
            <div className="placeholder-banner">
              <Ticket size={24} />
              <div>
                <p>No ticket types have been created yet.</p>
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {eventData.ticket_types.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="ticket-tier-management-card"
                >
                  <CardContent>
                    <div className="flex-header mb-3">
                      <div>
                        <CardTitle>
                          {ticket.name}
                        </CardTitle>

                        <CardDescription>
                          Ticket ID: #{ticket.id}
                        </CardDescription>
                      </div>

                      <div className="flex-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit size={14} />}
                          onClick={() =>
                            startEditing(
                              ticket.id,
                              ticket.name,
                              ticket.price,
                              ticket.quantity
                            )
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() =>
                            handleDelete(ticket.id)
                          }
                          disabled={
                            deletingId === ticket.id
                          }
                        >
                          {deletingId === ticket.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </Button>
                      </div>
                    </div>

                    <div className="stats-grid mt-4">
                      <div>
                        <p className="stat-label">
                          Price
                        </p>
                        <p className="stat-value">
                          ${ticket.price.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="stat-label">
                          Quantity
                        </p>
                        <p className="stat-value">
                          {ticket.quantity.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="stat-label">
                          Inventory Share
                        </p>
                        <p className="stat-value">
                          {totalTickets > 0
                            ? `${Math.round(
                                (ticket.quantity /
                                  totalTickets) *
                                  100
                              )}%`
                            : '0%'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() =>
            navigate('/organizer/events')
          }
        >
          Return to My Events
        </Button>
      </div>
    </div>
  );
};

export default OrganizerManageTicketsPage;