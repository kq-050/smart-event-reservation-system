import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Shield,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  Compass,
} from 'lucide-react';
import { getEvents } from '../api';
import {
  EventCard,
  LoadingState,
  ErrorState,
  EmptyState,
  Button,
} from '../components/common';
import type { Event } from '../types';

export const HomePage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeaturedEvents() {
      setIsLoading(true);
      setError(null);

      try {
        const eventsData = await getEvents({ limit: 6 });
        setFeaturedEvents(eventsData);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load featured events.';

        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeaturedEvents();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section mb-8">
        <div className="hero-content">
          <div className="hero-pill">
            <Sparkles size={14} className="text-primary" />
            <span>Find your next event</span>
          </div>

          <h1 className="hero-title">
            Discover Events. Reserve Your Spot. Enjoy the Experience.
          </h1>

          <p className="hero-subtitle">
            Find upcoming events, explore ticket options, and reserve your
            place before tickets run out.
          </p>

          <div className="hero-actions">
            <Link to="/events">
              <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                Explore Events
              </Button>
            </Link>

            <Link to="/organizer">
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Shield size={18} />}
              >
                Organizer Hub
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="highlights-grid mt-6">
          <div className="highlight-card">
            <div className="highlight-icon">
              <Ticket size={24} />
            </div>

            <h4 className="highlight-title">Easy Reservations</h4>

            <p className="highlight-text">
              Choose an event, select your ticket type, and reserve your spot
              in just a few steps.
            </p>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">
              <Clock size={24} />
            </div>

            <h4 className="highlight-title">10-Minute Ticket Hold</h4>

            <p className="highlight-text">
              Your selected tickets are held for 10 minutes while you complete
              your reservation.
            </p>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">
              <Shield size={24} />
            </div>

            <h4 className="highlight-title">Secure Accounts</h4>

            <p className="highlight-text">
              Attendee and organizer accounts have separate access to the
              features they need.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="featured-events-section mt-8 mb-8">
        <div className="section-header flex-between mb-4">
          <div>
            <div className="section-badge">
              <Compass size={14} />
              <span>Upcoming Events</span>
            </div>

            <h2 className="section-title">Find Something to Attend</h2>

            <p className="section-subtitle">
              Explore upcoming events and find one that interests you.
            </p>
          </div>

          <Link to="/events">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
            >
              View All Events
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <LoadingState message="Finding upcoming events..." />
        ) : error ? (
          <ErrorState title="Unable to load events" message={error} />
        ) : featuredEvents.length === 0 ? (
          <EmptyState
            title="No Events Available"
            description="There aren't any upcoming events available right now. Check back soon or create an event if you're an organizer."
            action={
              <Link to="/organizer/events/new">
                <Button variant="primary" size="sm">
                  Create an Event
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="events-grid">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section
        className="cta-banner p-6 rounded-lg border text-center mt-8"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
      >
        <h3 className="text-xl font-bold text-primary-text mb-2">
          Looking for Something Specific?
        </h3>

        <p className="text-muted text-sm max-w-md mx-auto mb-4">
          Search by event name or location to find exactly what you're looking
          for.
        </p>

        <Link to="/events">
          <Button variant="primary" leftIcon={<Search size={16} />}>
            Search Events
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;