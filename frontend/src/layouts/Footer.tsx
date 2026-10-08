import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-col footer-col-brand">
            <div className="footer-brand">
              <div className="brand-icon-wrapper-sm">
                <Calendar size={18} className="brand-icon" />
              </div>
              <span className="footer-brand-title">SmartEvents</span>
            </div>

            <p className="footer-description">
              A simple and reliable way to discover events, reserve tickets,
              and manage bookings.
            </p>
          </div>

          {/* Attendees */}
          <div className="footer-col">
            <h4 className="footer-heading">For Attendees</h4>

            <ul className="footer-link-list">
              <li>
                <Link to="/events" className="footer-link">
                  Browse Events
                </Link>
              </li>

              <li>
                <Link to="/bookings" className="footer-link">
                  My Bookings
                </Link>
              </li>

              <li>
                <Link to="/reservations" className="footer-link">
                  My Reservations
                </Link>
              </li>

              <li>
                <Link to="/profile" className="footer-link">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Organizers */}
          <div className="footer-col">
            <h4 className="footer-heading">For Organizers</h4>

            <ul className="footer-link-list">
              <li>
                <Link to="/organizer" className="footer-link">
                  Dashboard
                </Link>
              </li>

              <li>
                <Link to="/organizer/events" className="footer-link">
                  My Events
                </Link>
              </li>

              <li>
                <Link to="/organizer/events/new" className="footer-link">
                  Create Event
                </Link>
              </li>

              <li>
                <Link to="/organizer/reservations" className="footer-link">
                  Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="footer-col">
            <h4 className="footer-heading">SmartEvents</h4>

            <p className="footer-description">
              Built as a portfolio project to explore event management,
              reservations, and a better booking experience.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SmartEvents. All rights reserved.
          </p>

          <div className="footer-meta">
            <span className="flex-center gap-1">
              Made with <Heart size={13} className="heart-icon inline-icon" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;