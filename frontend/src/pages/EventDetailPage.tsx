import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Users,
  Ticket,
  Clock,
  LogIn,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import {
  getEventDetails,
  createReservation,
  confirmReservation,
  cancelReservation,
} from '../api';

import { useAuth } from '../hooks';

import {
  LoadingState,
  ErrorState,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/common';

import type { EventDetailsResponse } from '../types';
import type { Reservation } from '../types/reservation';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [eventDetails, setEventDetails] =
    useState<EventDetailsResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const [selectedTicketId, setSelectedTicketId] =
    useState<number | null>(null);

  const [quantity, setQuantity] = useState<number>(1);

  const [isReserving, setIsReserving] =
    useState<boolean>(false);

  const [isUpdatingReservation, setIsUpdatingReservation] =
    useState<boolean>(false);

  const [reservationError, setReservationError] =
    useState<string | null>(null);

  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [timeRemaining, setTimeRemaining] =
    useState<number | null>(null);

  // --------------------------------------------------
  // Countdown for active reservation
  // --------------------------------------------------

  useEffect(() => {
    if (!reservation || reservation.status !== 'active') {
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(
        `${reservation.expires_at}Z`
      ).getTime();

      const now = Date.now();

      const remaining = Math.max(
        0,
        Math.floor((expiresAt - now) / 1000)
      );

      setTimeRemaining(remaining);
    };

    updateCountdown();

    const interval = window.setInterval(
      updateCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [reservation]);

  // --------------------------------------------------
  // Load event details
  // --------------------------------------------------

  useEffect(() => {
    if (isNaN(numericId)) {
      return;
    }

    let isMounted = true;

    getEventDetails(numericId)
      .then((data) => {
        if (isMounted) {
          setEventDetails(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to load event details.';

          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [numericId, reloadKey]);

  // --------------------------------------------------
  // Retry loading event
  // --------------------------------------------------

  const handleRetry = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  // --------------------------------------------------
  // Ticket selection
  // --------------------------------------------------

  const handleSelectTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setQuantity(1);
    setReservationError(null);
  };

  const selectedTicket = eventDetails?.ticket_types.find(
    (ticket) => ticket.ticket_type_id === selectedTicketId
  );

  // --------------------------------------------------
  // Quantity controls
  // --------------------------------------------------

  const increaseQuantity = () => {
    if (!selectedTicket) {
      return;
    }

    setQuantity((current) =>
      Math.min(
        current + 1,
        selectedTicket.available_quantity
      )
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(current - 1, 1)
    );
  };

  // --------------------------------------------------
  // Create reservation
  // --------------------------------------------------

  const handleHoldTickets = async () => {
    if (!selectedTicketId || quantity < 1) {
      return;
    }

    try {
      setIsReserving(true);
      setReservationError(null);

      const createdReservation =
        await createReservation({
          ticket_type_id: selectedTicketId,
          quantity,
        });

      setReservation(createdReservation);

      // Refresh availability
      setReloadKey((prev) => prev + 1);
    } catch (error: unknown) {
      console.error('Reservation failed:', error);

      setReservationError(
        'Unable to reserve tickets. The selected quantity may no longer be available.'
      );
    } finally {
      setIsReserving(false);
    }
  };

  // --------------------------------------------------
  // Confirm reservation
  // --------------------------------------------------

  const handleConfirmReservation = async () => {
    if (!reservation) {
      return;
    }

    try {
      setIsUpdatingReservation(true);
      setReservationError(null);

      const updatedReservation =
        await confirmReservation(reservation.id);

      setReservation(updatedReservation);
      setTimeRemaining(null);
    } catch (error: unknown) {
      console.error(
        'Confirmation failed:',
        error
      );

      setReservationError(
        'Unable to confirm the reservation. Please try again.'
      );
    } finally {
      setIsUpdatingReservation(false);
    }
  };

  // --------------------------------------------------
  // Cancel reservation
  // --------------------------------------------------

  const handleCancelReservation = async () => {
    if (!reservation) {
      return;
    }

    try {
      setIsUpdatingReservation(true);
      setReservationError(null);

      const updatedReservation =
        await cancelReservation(reservation.id);

      setReservation(updatedReservation);
      setTimeRemaining(null);
    } catch (error: unknown) {
      console.error(
        'Cancellation failed:',
        error
      );

      setReservationError(
        'Unable to cancel the reservation. Please try again.'
      );
    } finally {
      setIsUpdatingReservation(false);
    }
  };

  // --------------------------------------------------
  // Format countdown
  // --------------------------------------------------

  const formatTimeRemaining = (
    seconds: number
  ) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(remainingSeconds).padStart(
      2,
      '0'
    )}`;
  };

  // --------------------------------------------------
  // Invalid event ID
  // --------------------------------------------------

  if (isNaN(numericId)) {
    return (
      <div className="page-container mb-6">
        <div className="mb-4">
          <Link to="/events">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={
                <ArrowLeft size={16} />
              }
            >
              Back to Events Catalog
            </Button>
          </Link>
        </div>

        <ErrorState
          title="Invalid Event"
          message="The requested event identifier is invalid."
        />
      </div>
    );
  }

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (isLoading) {
    return (
      <LoadingState
        fullPage
        message="Loading event details & ticket availability..."
      />
    );
  }

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------

  if (error || !eventDetails) {
    return (
      <div className="page-container mb-6">
        <div className="mb-4">
          <Link to="/events">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={
                <ArrowLeft size={16} />
              }
            >
              Back to Events Catalog
            </Button>
          </Link>
        </div>

        <ErrorState
          title="Event Not Found"
          message={
            error ||
            'The requested event could not be found or has been removed.'
          }
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const totalAvailableTickets =
    eventDetails.ticket_types.reduce(
      (acc, ticketType) =>
        acc + ticketType.available_quantity,
      0
    );

  // --------------------------------------------------
  // Main page
  // --------------------------------------------------

  return (
    <div className="page-container">
      {/* Back Link */}

      <div className="mb-4">
        <Link to="/events">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={
              <ArrowLeft size={16} />
            }
          >
            Back to Events Catalog
          </Button>
        </Link>
      </div>

      {/* Event Header */}

      <div className="event-detail-header mb-6">
        <div className="page-badge badge-public mb-2">
          <CalendarIcon size={14} />
          <span>
            Event #{eventDetails.id}
          </span>
        </div>

        <h1 className="page-title">
          {eventDetails.name}
        </h1>

        <div
          className="event-detail-meta-row flex-wrap gap-4 mt-3"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div className="flex-center gap-1 text-sm text-secondary">
            <MapPin
              size={16}
              className="text-primary"
            />
            <span>
              {eventDetails.location}
            </span>
          </div>

          <div className="flex-center gap-1 text-sm text-secondary">
            <Users
              size={16}
              className="text-muted"
            />
            <span>
              Venue Capacity:{' '}
              <strong>
                {eventDetails.capacity}
              </strong>{' '}
              seats
            </span>
          </div>

        </div>
      </div>

      {/* Main Grid */}

      <div
        className="event-detail-grid"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* LEFT COLUMN — TICKET TYPES */}

        <Card className="ticket-tiers-card">
  <CardHeader>
    <CardTitle className="flex-between">
      <span>Ticket Options</span>

      <Ticket
        size={20}
        className="text-primary"
      />
    </CardTitle>

    <CardDescription>
      Choose your ticket type and reserve your spot while
      tickets are available.
    </CardDescription>
  </CardHeader>

  <CardContent>
    {eventDetails.ticket_types.length === 0 ? (
      <div className="p-4 text-center text-muted text-sm border-dashed rounded">
        Tickets are not available for this event yet.
      </div>
    ) : (
      <div
        className="ticket-types-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {eventDetails.ticket_types.map((ticket) => (
          <div
            key={ticket.ticket_type_id}
            className="ticket-tier-box p-3 rounded border"
            onClick={() => {
              if (
                ticket.available_quantity > 0 &&
                !reservation
              ) {
                handleSelectTicket(
                  ticket.ticket_type_id
                );
              }
            }}
            style={{
              backgroundColor:
                selectedTicketId ===
                ticket.ticket_type_id
                  ? 'var(--primary-subtle)'
                  : 'var(--bg-secondary)',

              borderColor:
                selectedTicketId ===
                ticket.ticket_type_id
                  ? 'var(--primary)'
                  : 'var(--border-card)',

              cursor:
                ticket.available_quantity > 0 &&
                !reservation
                  ? 'pointer'
                  : 'not-allowed',

              opacity: reservation ? 0.7 : 1,
            }}
          >
            <div className="flex-between mb-2">
              <span className="font-bold text-primary">
                {ticket.ticket_type_name}
              </span>

              <span
                className={`route-badge ${
                  ticket.available_quantity > 0
                    ? 'badge-user'
                    : 'badge-danger'
                }`}
              >
                {ticket.available_quantity > 0
                  ? `${ticket.available_quantity} Available`
                  : 'Sold Out'}
              </span>
            </div>

            <div className="flex-between text-xs text-muted">
              <span>
                {ticket.total_quantity} tickets available in total
              </span>

              <span>
                {ticket.available_quantity} remaining
              </span>
            </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT COLUMN — RESERVATION */}

        <Card className="booking-cta-card">
          <CardHeader>
            <CardTitle className="flex-between">
              <span>
                Reserve Tickets
              </span>

              <Clock
                size={20}
                className="text-warning"
              />
            </CardTitle>

            <CardDescription>
              Your selected tickets will be held for 10 minutes
              while you complete your reservation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isAuthenticated ? (
              <div
                className="cta-content flex-col gap-3"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* SUCCESSFUL RESERVATION */}

                {reservation ? (
                  <div
                    className="reservation-success"
                    style={{
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      backgroundColor:
                        'var(--primary-subtle)',
                      border:
                        '1px solid var(--border-sage)',
                    }}
                  >
                    <div className="flex-center gap-2 mb-3">
                      <CheckCircle2
                        size={24}
                        className="text-primary"
                      />

                      <strong>
                        {reservation.status ===
                        'active'
                          ? 'Tickets Held Successfully!'
                          : reservation.status ===
                            'confirmed'
                          ? 'Reservation Confirmed!'
                          : 'Reservation Cancelled'}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                      }}
                    >
                      <div className="flex-between">
                        <span className="text-sm text-muted">
                          Booking Reference
                        </span>

                        <strong>
                          {
                            reservation.booking_reference
                          }
                        </strong>
                      </div>

                      <div className="flex-between">
                        <span className="text-sm text-muted">
                          Quantity
                        </span>

                        <strong>
                          {reservation.quantity}
                        </strong>
                      </div>

                      <div className="flex-between">
                        <span className="text-sm text-muted">
                          Status
                        </span>

                        <span className={`status-badge status-${reservation.status}`}>
                          {reservation.status === 'active'
                            ? 'On Hold'
                            : reservation.status === 'confirmed'
                              ? 'Confirmed'
                              : reservation.status === 'cancelled'
                                ? 'Cancelled'
                                : 'Expired'}
                        </span>
                      </div>

                      {reservation.status ===
                        'active' && (
                        <>
                          <div className="flex-between">
                            <span className="text-sm text-muted">
                              Time Remaining
                            </span>

                            <strong>
                              {timeRemaining !==
                              null
                                ? timeRemaining >
                                  0
                                  ? `⏱️ ${formatTimeRemaining(
                                      timeRemaining
                                    )}`
                                  : 'Expired'
                                : 'Calculating...'}
                            </strong>
                          </div>

                          <div className="flex-between">
                            <span className="text-sm text-muted">
                              Hold Expires
                            </span>

                            <strong>
                              {new Date(
                                `${reservation.expires_at}Z`
                              ).toLocaleString()}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Reservation error */}

                    {reservationError && (
                      <div
                        className="p-3 rounded"
                        style={{
                          marginTop: '1rem',
                          backgroundColor:
                            'rgba(239, 68, 68, 0.1)',
                          border:
                            '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <p className="text-sm text-warning">
                          {reservationError}
                        </p>
                      </div>
                    )}

                    {/* ACTIVE RESERVATION ACTIONS */}

                    {reservation.status ===
                      'active' && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          marginTop: '1rem',
                        }}
                      >
                        <Button
                          variant="primary"
                          className="w-full"
                          size="lg"
                          onClick={
                            handleConfirmReservation
                          }
                          disabled={
                            isUpdatingReservation ||
                            timeRemaining === 0
                          }
                        >
                          {isUpdatingReservation
                            ? 'Confirming...'
                            : 'Confirm Reservation'}
                        </Button>

                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={
                            handleCancelReservation
                          }
                          disabled={
                            isUpdatingReservation
                          }
                        >
                          {isUpdatingReservation
                            ? 'Processing...'
                            : 'Cancel Reservation'}
                        </Button>

                        <p className="text-sm text-muted text-center">
                          Your tickets are
                          temporarily held.
                          Confirm before the
                          hold expires.
                        </p>
                      </div>
                    )}

                    {/* CONFIRMED */}

                    {reservation.status ===
                      'confirmed' && (
                      <div
                        className="p-3 rounded"
                        style={{
                          marginTop: '1rem',
                          backgroundColor:
                            'rgba(34, 197, 94, 0.1)',
                          border:
                            '1px solid rgba(34, 197, 94, 0.3)',
                        }}
                      >
                        <p className="text-sm text-center">
                          Your reservation has
                          been confirmed
                          successfully.
                        </p>
                      </div>
                    )}

                    {/* CANCELLED */}

                    {reservation.status ===
                      'cancelled' && (
                      <div
                        className="p-3 rounded"
                        style={{
                          marginTop: '1rem',
                          backgroundColor:
                            'rgba(239, 68, 68, 0.1)',
                          border:
                            '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <p className="text-sm text-center">
                          Your reservation has
                          been cancelled.
                        </p>
                      </div>
                    )}

                    {/* Navigation */}

                    <div
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginTop: '1rem',
                      }}
                    >
                      <Link
                        to="/reservations"
                        style={{ flex: 1 }}
                      >
                        <Button
                          variant="primary"
                          className="w-full"
                        >
                          View Reservation
                        </Button>
                      </Link>

                      <Link
                        to="/bookings"
                        style={{ flex: 1 }}
                      >
                        <Button
                          variant="secondary"
                          className="w-full"
                        >
                          My Bookings
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Signed-in message */}

                    <div
                      className="info-callout p-3 rounded"
                      style={{
                        backgroundColor:
                          'var(--primary-subtle)',
                        border:
                          '1px solid var(--border-sage)',
                      }}
                    >
                      <p className="text-xs text-primary-text flex-center gap-1">
                        <CheckCircle2
                          size={14}
                        />

                        <span>
                          You are signed in and
                          eligible to hold
                          tickets.
                        </span>
                      </p>
                    </div>

                    {/* Ticket selected */}

                    {selectedTicket ? (
                      <>
                        <div
                          className="selected-ticket-summary p-3 rounded"
                          style={{
                            backgroundColor:
                              'var(--bg-secondary)',
                            border:
                              '1px solid var(--border-card)',
                          }}
                        >
                          <div className="flex-between mb-2">
                            <span className="font-bold">
                              {
                                selectedTicket.ticket_type_name
                              }
                            </span>

                            <span className="text-sm text-secondary">
                              {
                                selectedTicket.available_quantity
                              }{' '}
                              available
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent:
                                'space-between',
                              gap: '1rem',
                            }}
                          >
                            <span className="text-sm text-muted">
                              Quantity
                            </span>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                              }}
                            >
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={
                                  decreaseQuantity
                                }
                                disabled={
                                  quantity <= 1 ||
                                  isReserving
                                }
                              >
                                −
                              </Button>

                              <strong>
                                {quantity}
                              </strong>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={
                                  increaseQuantity
                                }
                                disabled={
                                  quantity >=
                                    selectedTicket.available_quantity ||
                                  isReserving
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Reservation error */}

                        {reservationError && (
                          <div
                            className="p-3 rounded"
                            style={{
                              backgroundColor:
                                'rgba(239, 68, 68, 0.1)',
                              border:
                                '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <p className="text-sm text-warning">
                              {reservationError}
                            </p>
                          </div>
                        )}

                        {/* Hold button */}

                        <Button
                          onClick={
                            handleHoldTickets
                          }
                          disabled={isReserving}
                          className="w-full"
                          size="lg"
                        >
                          {isReserving
                            ? 'Holding...'
                            : `Hold ${quantity} Ticket${
                                quantity > 1
                                  ? 's'
                                  : ''
                              }`}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full"
                        size="lg"
                        disabled={
                          totalAvailableTickets ===
                          0
                        }
                      >
                        {totalAvailableTickets >
                        0
                          ? 'Select a Ticket Type'
                          : 'Event Sold Out'}
                      </Button>
                    )}

                    <p className="text-xs text-muted text-center">
                      Your tickets will be held for 10 minutes.
                      If you don't complete your reservation within
                      that time, they'll be released automatically.
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* NOT AUTHENTICATED */

              <div
                className="cta-content flex-col gap-3"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  className="info-callout p-3 rounded"
                  style={{
                    backgroundColor:
                      'rgba(245, 158, 11, 0.1)',
                    border:
                      '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <p className="text-xs text-warning flex-center gap-1">
                    <AlertTriangle
                      size={14}
                    />

                    <span>
                      Sign in required to place
                      ticket holds.
                    </span>
                  </p>
                </div>

                <Link
                  to="/login"
                  state={{ from: location }}
                >
                  <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    leftIcon={
                      <LogIn size={16} />
                    }
                  >
                    Sign In to Reserve Tickets
                  </Button>
                </Link>

                <p className="text-xs text-muted text-center">
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/register"
                    className="auth-switch-link"
                  >
                    Register here
                  </Link>
                  .
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter>
          <span className="text-xs text-muted">
            Your selected tickets are held for 10 minutes.
            Complete your reservation before the hold expires.
          </span>
        </CardFooter>
        </Card>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Calendar icon
// --------------------------------------------------

const CalendarIcon: React.FC<{
  size?: number;
}> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
    />

    <line
      x1="16"
      y1="2"
      x2="16"
      y2="6"
    />

    <line
      x1="8"
      y1="2"
      x2="8"
      y2="6"
    />

    <line
      x1="3"
      y1="10"
      x2="21"
      y2="10"
    />
  </svg>
);

export default EventDetailPage;