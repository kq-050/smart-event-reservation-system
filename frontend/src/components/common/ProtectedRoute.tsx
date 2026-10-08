import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../hooks';
import { LoadingState } from './LoadingState';
import { Button } from './Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
import type { UserRole } from '../../types';

export interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage message="Verifying authentication session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="page-container" style={{ paddingTop: '2rem' }}>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="auth-icon-badge">
              <ShieldAlert size={28} />
            </div>

            <CardTitle className="text-center">
              Organizer Access Only
            </CardTitle>

            <CardDescription className="text-center">
              The Organizer Hub is available to event organizers.
              Your account is currently set up as an attendee.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-muted text-sm text-center">
              If you'd like to organize events, please contact the
              administrator to request organizer access.
            </p>
          </CardContent>

          <CardFooter
            style={{
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/events">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
              >
                Browse Events
              </Button>
            </Link>

            <Link to="/">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Home size={14} />}
              >
                Go to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;