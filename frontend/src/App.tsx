import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context';
import { AppLayout } from './layouts';

import { ProtectedRoute } from './components/common/ProtectedRoute';

import OrganizerManageTicketsPage from './pages/organizer/OrganizerManageTicketsPage';
import OrganizerReservationQueuePage from './pages/organizer/OrganizerReservationQueuePage';

import {
  HomePage,
  EventsPage,
  EventDetailPage,
  LoginPage,
  RegisterPage,
  BookingsPage,
  ReservationsPage,
  ProfilePage,
  OrganizerDashboardPage,
  OrganizerEventsPage,
  OrganizerCreateEventPage,
  OrganizerEditEventPage,
  NotFoundPage,
} from './pages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>

            {/* Public Discovery & Auth Routes */}
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/events"
              element={<EventsPage />}
            />

            <Route
              path="/events/:id"
              element={<EventDetailPage />}
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register"
              element={<RegisterPage />}
            />

            {/* Protected Attendee Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/bookings"
                element={<BookingsPage />}
              />

              <Route
                path="/reservations"
                element={<ReservationsPage />}
              />

              <Route
                path="/profile"
                element={<ProfilePage />}
              />
            </Route>

            {/* Protected Organizer Routes */}
            <Route
              element={
                <ProtectedRoute requiredRole="organizer" />
              }
            >
              {/* Organizer Dashboard */}
              <Route
                path="/organizer"
                element={<OrganizerDashboardPage />}
              />

              {/* Organizer Events */}
              <Route
                path="/organizer/events"
                element={<OrganizerEventsPage />}
              />

              {/* Create Event */}
              <Route
                path="/organizer/events/new"
                element={<OrganizerCreateEventPage />}
              />

              {/* Edit Event */}
              <Route
                path="/organizer/events/:eventId/edit"
                element={<OrganizerEditEventPage />}
              />

              {/* Manage Ticket Types */}
              <Route
                path="/organizer/events/:eventId/tickets"
                element={<OrganizerManageTicketsPage />}
              />

              {/* Organizer Reservation Queue */}
              <Route
                path="/organizer/reservations"
                element={<OrganizerReservationQueuePage />}
              />
            </Route>

            {/* Fallback 404 Route */}
            <Route
              path="*"
              element={<NotFoundPage />}
            />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;