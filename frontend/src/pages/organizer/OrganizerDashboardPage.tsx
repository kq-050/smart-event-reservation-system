import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  PlusCircle,
  Calendar,
  Users,
  DollarSign,
  Ticket,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/common/Card';

import { Button } from '../../components/common/Button';
import { getOrganizerDashboard } from '../../api';
import type { OrganizerDashboard } from '../../api/organizer';

export const OrganizerDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] =
    React.useState<OrganizerDashboard | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboard = async () => {
  try {
    setLoading(true);
    setError(null);

    const data = await getOrganizerDashboard();
    setDashboard(data);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to load organizer dashboard.'
    );
  } finally {
    setLoading(false);
  }
};

React.useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const data = await getOrganizerDashboard();
      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load organizer dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  void fetchDashboard();
}, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex-header">
        <div>
          <div className="page-badge badge-organizer-wrap">
            <Shield size={14} />
            <span>Organizer Console</span>
          </div>

          <h1 className="page-title">Organizer Dashboard</h1>

          <p className="page-description">
            Monitor your events, reservations, ticket sales, and revenue.
          </p>
        </div>

        <div>
          <Link to="/organizer/events/new">
            <Button leftIcon={<PlusCircle size={16} />}>
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Subnavigation */}
      <div className="subnav-bar">
        <Link
          to="/organizer"
          className="subnav-link subnav-active"
        >
          Dashboard Overview
        </Link>

        <Link
          to="/organizer/events"
          className="subnav-link"
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
              <RefreshCw size={24} className="text-muted" />
              <p>Loading organizer dashboard...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="mt-4">
          <CardContent>
            <div className="placeholder-banner">
              <XCircle size={24} className="text-muted" />

              <div>
                <p>{error}</p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadDashboard()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard */}
      {!loading && !error && dashboard && (
        <div className="placeholder-content">
          {/* Main statistics */}
          <div className="stats-preview-grid">
            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <DollarSign size={20} />
                </div>

                <p className="stat-label">Total Revenue</p>

                <h3 className="stat-value">
                  ${dashboard.total_revenue.toLocaleString()}
                </h3>

                <p className="stat-subtext">
                  From confirmed bookings
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Calendar size={20} />
                </div>

                <p className="stat-label">Total Events</p>

                <h3 className="stat-value">
                  {dashboard.total_events}
                </h3>

                <p className="stat-subtext">
                  Events created by you
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Users size={20} />
                </div>

                <p className="stat-label">Confirmed Bookings</p>

                <h3 className="stat-value">
                  {dashboard.confirmed_bookings}
                </h3>

                <p className="stat-subtext">
                  Completed reservations
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Ticket size={20} />
                </div>

                <p className="stat-label">Tickets Sold</p>

                <h3 className="stat-value">
                  {dashboard.total_tickets_sold}
                </h3>

                <p className="stat-subtext">
                  Across all events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reservation statistics */}
          <div className="stats-preview-grid mt-4">
            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Clock size={20} />
                </div>

                <p className="stat-label">Active Reservations</p>

                <h3 className="stat-value">
                  {dashboard.active_reservations}
                </h3>

                <p className="stat-subtext">
                  Currently holding tickets
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <Calendar size={20} />
                </div>

                <p className="stat-label">Ticket Types</p>

                <h3 className="stat-value">
                  {dashboard.total_ticket_types}
                </h3>

                <p className="stat-subtext">
                  Across all events
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <XCircle size={20} />
                </div>

                <p className="stat-label">Cancelled</p>

                <h3 className="stat-value">
                  {dashboard.cancelled_reservations}
                </h3>

                <p className="stat-subtext">
                  Cancelled reservations
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent>
                <div className="stat-icon-wrap">
                  <RefreshCw size={20} />
                </div>

                <p className="stat-label">Expired</p>

                <h3 className="stat-value">
                  {dashboard.expired_reservations}
                </h3>

                <p className="stat-subtext">
                  Expired reservations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Per-event statistics */}
          <Card className="placeholder-card mt-4">
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>

              <CardDescription>
                Ticket sales, reservations, capacity, and revenue for
                each of your events.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {dashboard.events.length === 0 ? (
                <div className="placeholder-banner">
                  <Calendar size={28} className="text-muted" />

                  <div>
                    <p>No events created yet.</p>

                    <Link to="/organizer/events/new">
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Create Your First Event
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="event-performance-grid">
                  {dashboard.events.map((event) => (
                    <div
                      key={event.event_id}
                      className="event-performance-card"
                    >
                      <div className="performance-card-top flex-between mb-3">
                        <div>
                          <span className="route-badge badge-public mb-1">
                            Event #{event.event_id}
                          </span>
                          <h4 className="performance-event-title">
                            {event.event_name}
                          </h4>
                        </div>
                        <span className="status-badge status-confirmed">
                          ${event.total_revenue.toLocaleString()}
                        </span>
                      </div>

                      <div className="performance-metrics-grid mb-4">
                        <div className="metric-chip">
                          <span className="metric-label">Capacity</span>
                          <span className="metric-val">{event.capacity.toLocaleString()}</span>
                        </div>
                        <div className="metric-chip">
                          <span className="metric-label">Sold</span>
                          <span className="metric-val text-primary font-bold">{event.tickets_sold}</span>
                        </div>
                        <div className="metric-chip">
                          <span className="metric-label">Available</span>
                          <span className="metric-val">{event.tickets_available}</span>
                        </div>
                        <div className="metric-chip">
                          <span className="metric-label">Confirmed</span>
                          <span className="metric-val">{event.confirmed_bookings}</span>
                        </div>
                        <div className="metric-chip">
                          <span className="metric-label">Active Holds</span>
                          <span className="metric-val">{event.active_reservations}</span>
                        </div>
                      </div>

                      <div className="performance-card-actions flex-between pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <span className="text-xs text-muted">
                          {event.tickets_available > 0 ? `${event.tickets_available} tickets remaining` : 'Sold out'}
                        </span>
                        <Link to={`/organizer/events/${event.event_id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ArrowRight size={14} />}
                          >
                            Manage Event
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboardPage;