import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, Ticket, XCircle, CheckCircle } from 'lucide-react';

import { cancelReservation, confirmReservation, getMyReservations } from '../api/reservation';
import type { Reservation } from '../types/reservation';

import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';


const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusLabel = (status: Reservation['status']) => {
  switch (status) {
    case 'active':
      return 'On Hold';
    case 'confirmed':
      return 'Confirmed';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getMyReservations();
      setReservations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your reservations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  let cancelled = false;

  const loadInitialReservations = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getMyReservations();

      if (!cancelled) {
        setReservations(data);
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load your reservations.'
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void loadInitialReservations();

  return () => {
    cancelled = true;
  };
}, []);

  const handleCancel = async (reservationId: number) => {
    try {
      setActionLoading(reservationId);
      setError('');

      await cancelReservation(reservationId);
      await loadReservations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel this reservation.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (reservationId: number) => {
    try {
      setActionLoading(reservationId);
      setError('');

      await confirmReservation(reservationId);
      await loadReservations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to confirm this reservation.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>My Reservations</h1>
          <p>Manage your event reservations and ticket holds.</p>
        </div>

        <div className="reservation-list">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent>
                <div className="reservation-skeleton">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container reservations-page">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Manage your event reservations and ticket holds.</p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {reservations.length === 0 ? (
        <EmptyState
          title="No reservations yet"
          description="When you reserve tickets for an event, they will appear here."
        />
      ) : (
        <div className="reservation-list">
          {reservations.map((reservation) => {
            const isActive = reservation.status === 'active';
            const isConfirmed = reservation.status === 'confirmed';
            const isCancelled = reservation.status === 'cancelled';
            const isExpired = reservation.status === 'expired';

            return (
              <Card
                key={reservation.id}
                className="reservation-card"
              >
                <CardContent>
                  <div className="reservation-card-inner">
                    {/* Header */}
                    <div className="reservation-header">
                      <div className="reservation-title-group">
                        <h2>{reservation.event_name}</h2>
                        <p>{reservation.ticket_type_name}</p>
                      </div>

                      <span
                        className={`status-badge status-${reservation.status}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>

                    {/* Main ticket information */}
                    <div className="reservation-main">
                      <div className="reservation-ticket-info">
                        <div className="reservation-ticket-icon">
                          <Ticket size={22} />
                        </div>

                        <div>
                          <span className="reservation-label">
                            Ticket Type
                          </span>
                          <strong>{reservation.ticket_type_name}</strong>
                        </div>
                      </div>

                      <div className="reservation-quantity">
                        <span className="reservation-label">Quantity</span>
                        <strong>{reservation.quantity}</strong>
                      </div>

                      <div className="reservation-price">
                        <span className="reservation-label">Total</span>
                        <strong>
                          PKR {reservation.total_price.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="reservation-meta">
                      <div>
                        <span className="reservation-label">
                          Booking Reference
                        </span>
                        <strong>{reservation.booking_reference}</strong>
                      </div>

                      <div>
                        <span className="reservation-label">
                          Reserved
                        </span>
                        <span className="reservation-meta-value">
                          <CalendarDays size={15} />
                          {formatDateTime(reservation.created_at)}
                        </span>
                      </div>

                      {isActive && (
                        <div>
                          <span className="reservation-label">
                            Hold Expires
                          </span>
                          <span className="reservation-meta-value">
                            <Clock size={15} />
                            {formatDateTime(reservation.expires_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status message */}
                    <div
                      className={`reservation-message reservation-message-${reservation.status}`}
                    >
                      {isActive && (
                        <>
                          <Clock size={18} />
                          <span>
                            Your tickets are currently held for you.
                            Complete your reservation before the hold expires.
                          </span>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <CheckCircle size={18} />
                          <span>
                            Your reservation is confirmed. Your tickets are
                            secured for this event.
                          </span>
                        </>
                      )}

                      {isCancelled && (
                        <>
                          <XCircle size={18} />
                          <span>
                            This reservation was cancelled and the tickets
                            have been released.
                          </span>
                        </>
                      )}

                      {isExpired && (
                        <>
                          <Clock size={18} />
                          <span>
                            This reservation expired before it was confirmed,
                            and the tickets have been released.
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {isActive && (
                      <div className="reservation-actions">
                        <Button
                          variant="primary"
                          onClick={() => handleConfirm(reservation.id)}
                          disabled={actionLoading === reservation.id}
                        >
                          {actionLoading === reservation.id
                            ? 'Processing...'
                            : 'Confirm Reservation'}
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => handleCancel(reservation.id)}
                          disabled={actionLoading === reservation.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;