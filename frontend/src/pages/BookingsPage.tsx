import React, { useEffect, useState } from 'react';
import {
  BookmarkCheck,
  Ticket,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/common/Card';
import {
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../components/common';
import { getMyBookings } from '../api';
import type { Reservation } from '../types/reservation';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMyBookings()
      .then((data) => {
        if (isMounted) {
          setBookings(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to load your bookings.';

          setError(message);
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
  }, []);

  const formatDate = (date: string) => {
    return new Date(`${date}Z`).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge">
            <BookmarkCheck size={14} />
            <span>Confirmed Tickets</span>
          </div>

          <h1 className="page-title">My Bookings</h1>

          <p className="page-description">
            View your confirmed ticket bookings and booking references.
          </p>
        </div>

        <LoadingState message="Loading your bookings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge">
            <BookmarkCheck size={14} />
            <span>Confirmed Tickets</span>
          </div>

          <h1 className="page-title">My Bookings</h1>

          <p className="page-description">
            View your confirmed ticket bookings and booking references.
          </p>
        </div>

        <ErrorState
          title="Unable to load bookings"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-badge">
          <BookmarkCheck size={14} />
          <span>Confirmed Tickets</span>
        </div>

        <h1 className="page-title">My Bookings</h1>

        <p className="page-description">
          View your confirmed ticket bookings and unique booking references.
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Ticket size={32} />}
          title="No confirmed bookings"
          description="Once you confirm a ticket reservation, your booking will appear here."
        />
      ) : (
        <div className="card-grid">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="booking-card-header">
                  <div>
                    <CardTitle>
                      Booking {booking.booking_reference}
                    </CardTitle>

                    <CardDescription>
                      Booking #{booking.id}
                    </CardDescription>
                  </div>

                  <div className="booking-status">
                    <CheckCircle size={18} />
                    <span>Confirmed</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="booking-details">
                  <div className="booking-detail">
                    <span className="text-muted">Ticket Type ID</span>
                    <strong>{booking.ticket_type_id}</strong>
                  </div>

                  <div className="booking-detail">
                    <span className="text-muted">Quantity</span>
                    <strong>{booking.quantity}</strong>
                  </div>

                  <div className="booking-detail">
                    <span className="text-muted">Booked On</span>
                    <strong>{formatDate(booking.created_at)}</strong>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <div className="booking-footer">
                  <div className="booking-reference">
                    <Calendar size={16} />
                    <span>{booking.booking_reference}</span>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        booking.booking_reference
                      )
                    }
                  >
                    Copy Reference
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;