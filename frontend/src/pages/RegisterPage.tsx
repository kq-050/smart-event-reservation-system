import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, User as UserIcon, Mail, Lock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Client-side validations
    if (trimmedName.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      // Clear passwords from memory
      setPassword('');
      setConfirmPassword('');

      // Redirect to events catalog
      navigate('/events', { replace: true });
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
            <UserPlus size={24} />
          </div>
          <CardTitle className="text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Register to hold tickets, make bookings, and access event queues.
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
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="input-wrapper">
                <UserIcon size={18} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="form-label">
                Password (min 8 characters)
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="register-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                Create Account
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="auth-card-footer">
          <p className="text-sm text-muted">
            Already registered?{' '}
            <Link to="/login" className="auth-switch-link">
              Sign in to your account <ArrowRight size={13} className="inline-icon" />
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
