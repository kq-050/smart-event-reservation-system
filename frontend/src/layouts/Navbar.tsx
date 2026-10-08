import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Menu, X, Shield, Ticket, User as UserIcon, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login');
  };

  const isOrganizer = user?.role === 'organizer';

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-icon-wrapper">
            <Calendar className="brand-icon" size={22} />
          </div>
          <span className="brand-text">SmartEvents</span>
        </Link>

        {/* Desktop Primary Navigation */}
        <nav className="navbar-nav desktop-nav">
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Events
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                Bookings
              </NavLink>
              <NavLink
                to="/reservations"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                Reservations
              </NavLink>
            </>
          )}

          {isAuthenticated && isOrganizer && (
            <NavLink
              to="/organizer"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Shield size={15} className="inline-icon text-warning" />
              <span>Organizer Portal</span>
            </NavLink>
          )}
        </nav>

        {/* Desktop Auth Section */}
        <div className="navbar-auth desktop-auth">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                title="User Profile"
              >
                <UserIcon size={16} className="inline-icon" />
                <span>{user?.name || 'Profile'}</span>
                {isOrganizer && (
                  <span className="route-badge badge-organizer" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                    Organizer
                  </span>
                )}
              </NavLink>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                <LogIn size={14} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={14} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav-links">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Ticket size={18} />
              <span>Events</span>
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/bookings"
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span>Bookings</span>
                </NavLink>
                <NavLink
                  to="/reservations"
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span>Reservations</span>
                </NavLink>

                {isOrganizer && (
                  <NavLink
                    to="/organizer"
                    className={({ isActive }) =>
                      `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
                    }
                    onClick={closeMobileMenu}
                  >
                    <Shield size={18} className="text-warning" />
                    <span>Organizer Portal</span>
                  </NavLink>
                )}

                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <UserIcon size={18} />
                  <span>My Profile ({user?.name})</span>
                </NavLink>

                <div className="mobile-menu-divider" />
                <button
                  type="button"
                  className="btn btn-outline btn-md w-full"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <div className="mobile-menu-divider" />
                <div className="mobile-auth-actions">
                  <Link
                    to="/login"
                    className="btn btn-outline btn-md w-full"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-md w-full"
                    onClick={closeMobileMenu}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
