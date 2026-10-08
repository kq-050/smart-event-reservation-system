import React, { useState, useEffect } from 'react';
import { Search, MapPin, X, ChevronLeft, ChevronRight, SlidersHorizontal, Calendar } from 'lucide-react';
import { getEvents } from '../api';
import { EventCard, LoadingState, ErrorState, EmptyState, Button } from '../components/common';
import type { Event } from '../types';

const PAGE_SIZE = 9; // Grid friendly size

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [activeLocation, setActiveLocation] = useState<string>('');

  // Pagination state
  const [skip, setSkip] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    getEvents({
      search: activeSearch || undefined,
      location: activeLocation || undefined,
      skip,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (isMounted) {
          setEvents(data);
          setError(null);
          setHasMore(data.length === PAGE_SIZE);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load events. Please try again.';
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
  }, [activeSearch, activeLocation, skip, reloadKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSkip(0); // Reset to first page
    setActiveSearch(searchInput.trim());
    setActiveLocation(locationInput.trim());
  };

  const handleClearFilters = () => {
    setIsLoading(true);
    setSearchInput('');
    setLocationInput('');
    setActiveSearch('');
    setActiveLocation('');
    setSkip(0);
  };

  const handleNextPage = () => {
    setIsLoading(true);
    setSkip((prev) => prev + PAGE_SIZE);
  };

  const handlePrevPage = () => {
    setIsLoading(true);
    setSkip((prev) => Math.max(0, prev - PAGE_SIZE));
  };

  const handleRetry = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const hasActiveFilters = Boolean(activeSearch || activeLocation);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-badge">
          <Calendar size={14} />
          <span>Live Catalog</span>
        </div>
        <h1 className="page-title">Discover Events</h1>
        <p className="page-description">
          Find upcoming concerts, tech conferences, and workshops with real-time seat tracking.
        </p>
      </div>

      {/* Search and Location Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="search-filter-bar mb-6">
        <div className="filter-inputs-grid">
          <div className="input-wrapper flex-1">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search events by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="input-wrapper flex-1">
            <MapPin size={18} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Filter by city or location..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
            />
          </div>

          <div className="filter-actions-row">
            <Button type="submit" variant="primary" leftIcon={<SlidersHorizontal size={16} />}>
              Filter
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                leftIcon={<X size={16} />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="active-filters-row mb-4 flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
          <span className="text-xs text-muted">Active Filters:</span>
          {activeSearch && (
            <span className="route-badge badge-public">
              Search: &quot;{activeSearch}&quot;
            </span>
          )}
          {activeLocation && (
            <span className="route-badge badge-user">
              Location: &quot;{activeLocation}&quot;
            </span>
          )}
        </div>
      )}

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Fetching events from server..." />
      ) : error ? (
        <ErrorState
          title="Error Loading Events"
          message={error}
          onRetry={handleRetry}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="No Events Found"
          description={
            hasActiveFilters
              ? 'No events match your current search and location filters. Try clearing filters or searching for another term.'
              : 'There are currently no public events available. Check back soon or create one as an organizer!'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="pagination-bar flex-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={skip === 0}
              onClick={handlePrevPage}
              leftIcon={<ChevronLeft size={16} />}
            >
              Previous
            </Button>

            <span className="text-xs text-muted font-mono">
              Page {currentPage}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={handleNextPage}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventsPage;
