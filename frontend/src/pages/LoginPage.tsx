import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preserve target route if redirected from ProtectedRoute
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      const loggedInUser = await login({
        email: trimmedEmail,
        password,
      });

      // Redirect to original destination or role-based default route
      if (from) {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === 'organizer') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/events', { replace: true });
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Invalid email or password.';
      setErrorMessage(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <Card className="auth-card">
        <CardHeader>
          <div className="auth-icon-badge">
            <LogIn size={24} />
          </div>
          <CardTitle className="text-center">Sign In to SmartEvents</CardTitle>
          <CardDescription className="text-center">
            Access your ticket holds, confirmed bookings, or organizer dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="form-error-banner" role="alert">
              <AlertCircle size={18} className="inline-icon text-danger" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="auth-card-footer">
          <p className="text-sm text-muted">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="auth-switch-link">
              Create an account <ArrowRight size={13} className="inline-icon" />
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
