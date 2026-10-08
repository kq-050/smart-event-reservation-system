import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  RefreshCw,
  Ticket,
  User,
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
  getOrganizerReservations,
  type OrganizerReservation,
  type OrganizerReservationStatus,
} from '../../api/organizer';

const statusOptions: Array<{
  label: string;
  value: OrganizerReservationStatus | 'all';
}> = [
  { label: 'All Reservations', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' },
];

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function formatStatus(status: OrganizerReservationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClass(status: OrganizerReservationStatus): string {
  return `status-badge status-${status}`;
}

export const OrganizerReservationQueuePage: React.FC = () => {
  const [reservations, setReservations] = React.useState<
    OrganizerReservation[]
  >([]);

  const [status, setStatus] = React.useState<
    OrganizerReservationStatus | 'all'
  >('all');

  const [skip, setSkip] = React.useState(0);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const limit = 10;

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getOrganizerReservations(
        status === 'all' ? undefined : status,
        skip,
        limit
      );

      setReservations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load reservations.'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getOrganizerReservations(
          status === 'all' ? undefined : status,
          skip,
          limit
        );

        setReservations(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load reservations.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [status, skip]);

  const handleStatusChange = (
    newStatus: OrganizerReservationStatus | 'all'
  ) => {
    setStatus(newStatus);
    setSkip(0);
  };

  const handlePrevious = () => {
    setSkip((current) => Math.max(current - limit, 0));
  };

  const handleNext = () => {
    if (reservations.length === limit) {
      setSkip((current) => current + limit);
    }
  };

  const totalVisibleRevenue = reservations
    .filter((reservation) => reservation.status === 'confirmed')
    .reduce(
      (total, reservation) => total + reservation.total_price,
      0
    );

  return (
    <div className="page-container">
      <div className="mb-4">
        <Link to="/organizer">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="page-header">
        <div className="page-badge badge-organizer-wrap">
          <Calendar size={14} />
          <span>Organizer Management</span>
        </div>

        <h1 className="page-title">
          Reservation Queue
        </h1>

        <p className="page-description">
          Monitor customer reservations and booking activity
          across your events.
        </p>
      </div>

      <Card className="mt-4">
        <CardContent>
          <div className="button-group-wrap">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  status === option.value
                    ? 'primary'
                    : 'outline'
                }
                size="sm"
                onClick={() =>
                  handleStatusChange(option.value)
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <XCircle size={22} />

              <div>
                <p>{error}</p>

                <Button
                  className="mt-2"
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={15} />}
                  onClick={loadReservations}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && !loading && reservations.length === 0 && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <Ticket size={24} />

              <div>
                <p>No reservations found.</p>

                <p className="stat-subtext">
                  Try another status filter or check again
                  later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && !loading && reservations.length > 0 && (
        <>
          <div className="stats-grid mt-4">
            <Card>
              <CardContent>
                <p className="stat-label">
                  Reservations
                </p>

                <p className="stat-value">
                  {reservations.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="stat-label">
                  Tickets
                </p>

                <p className="stat-value">
                  {reservations.reduce(
                    (total, reservation) =>
                      total + reservation.quantity,
                    0
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="stat-label">
                  Confirmed Revenue
                </p>

                <p className="stat-value">
                  ${totalVisibleRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            {reservations.map((reservation) => (
              <Card
                key={reservation.id}
                className="placeholder-card mb-4"
              >
                <CardHeader>
                  <div className="flex-header">
                    <div>
                      <CardTitle>
                        {reservation.booking_reference}
                      </CardTitle>

                      <CardDescription>
                        Reservation #{reservation.id}
                      </CardDescription>
                    </div>

                    <span
                      className={getStatusClass(
                        reservation.status
                      )}
                    >
                      {formatStatus(
                        reservation.status
                      )}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="queue-reservation-grid">
                    <div className="queue-cell">
                      <span className="queue-cell-label flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                        <User size={13} className="text-primary" /> Customer
                      </span>
                      <strong className="queue-cell-title block mt-1">{reservation.customer_name}</strong>
                      <span className="queue-cell-sub flex-center gap-1 text-muted text-xs mt-1" style={{ justifyContent: 'flex-start' }}>
                        <Mail size={12} /> {reservation.customer_email}
                      </span>
                    </div>

                    <div className="queue-cell">
                      <span className="queue-cell-label flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                        <Calendar size={13} className="text-primary" /> Event
                      </span>
                      <strong className="queue-cell-title block mt-1">{reservation.event_name}</strong>
                      <span className="queue-cell-sub text-muted text-xs block mt-1">Event #{reservation.event_id}</span>
                    </div>

                    <div className="queue-cell">
                      <span className="queue-cell-label flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                        <Ticket size={13} className="text-primary" /> Ticket Type
                      </span>
                      <strong className="queue-cell-title block mt-1">{reservation.ticket_type_name}</strong>
                      <span className="queue-cell-sub text-muted text-xs block mt-1">
                        {reservation.quantity} × ${reservation.ticket_price.toLocaleString()}
                      </span>
                    </div>

                    <div className="queue-cell queue-cell-total">
                      <span className="queue-cell-label block">Total Amount</span>
                      <span className="queue-total-amount text-xl font-bold text-primary block mt-1">
                        ${reservation.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="queue-timestamp-bar mt-3 pt-3 flex-between flex-wrap gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs text-muted flex-center gap-1">
                      <Clock size={12} /> Created: <strong>{formatDate(reservation.created_at)}</strong>
                    </span>
                    <span className="text-xs text-muted flex-center gap-1">
                      <Clock size={12} /> Hold Expiration: <strong>{formatDate(reservation.expires_at)}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="button-group-wrap justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={skip === 0 || loading}
              onClick={handlePrevious}
            >
              Previous
            </Button>

            <p className="stat-subtext">
              Showing {skip + 1}–{skip + reservations.length}
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={
                reservations.length < limit || loading
              }
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {loading && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <RefreshCw size={22} />

              <div>
                <p>Loading reservations...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizerReservationQueuePage;