import React from 'react';
import { Link } from 'react-router-dom';
import { ListOrdered, Filter } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/common/Card';

export const OrganizerReservationsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-badge badge-organizer-wrap">
          <ListOrdered size={14} />
          <span>Reservation Management</span>
        </div>

        <h1 className="page-title">Reservation Queue</h1>

        <p className="page-description">
          Review attendee reservations, ticket holds, and booking activity
          across your events.
        </p>
      </div>

      <div className="subnav-bar">
        <Link to="/organizer" className="subnav-link">
          Dashboard Overview
        </Link>

        <Link to="/organizer/events" className="subnav-link">
          My Events
        </Link>

        <Link to="/organizer/events/new" className="subnav-link">
          Create Event
        </Link>

        <Link
          to="/organizer/reservations"
          className="subnav-link subnav-active"
        >
          Reservation Queue
        </Link>
      </div>

      <div className="placeholder-content">
        <Card className="placeholder-card">
          <CardHeader>
            <CardTitle>Reservations &amp; Holds</CardTitle>

            <CardDescription>
              View and manage attendee reservations, ticket quantities,
              booking references, and reservation status.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="placeholder-banner">
              <Filter size={28} className="text-muted" />

              <p>
                Filterable reservation details with customer information,
                ticket pricing, booking references, and reservation status
                will appear here.
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <span className="text-muted text-sm">
              Reservations are automatically updated as their status changes.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerReservationsPage;