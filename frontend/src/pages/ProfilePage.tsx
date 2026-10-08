import React from 'react';
import {
  User as UserIcon,
  Shield,
  Mail,
  Key,
  LogOut,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-badge">
            <UserIcon size={14} />
            <span>My Profile</span>
          </div>

          <h1 className="page-title">Profile</h1>

          <p className="page-description">
            Your account information.
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent>
            <p className="text-muted">
              Unable to load your profile information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel =
    user.role === 'organizer' ? 'Organizer' : 'Attendee';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-badge">
          <UserIcon size={14} />
          <span>My Profile</span>
        </div>

        <h1 className="page-title">Account Profile</h1>

        <p className="page-description">
          Manage and view your account identity and system role.
        </p>
      </div>

      <div className="profile-content">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="auth-icon-badge">
              <UserIcon size={28} />
            </div>

            <CardTitle className="text-center">
              {user.name}
            </CardTitle>

            <CardDescription className="text-center">
              Smart Event Reservation Account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="profile-info-grid">
              <div className="info-row">
                <Key size={18} className="text-muted" />

                <div>
                  <p className="text-xs text-muted">User ID</p>
                  <p className="font-mono text-sm">
                    #{user.id}
                  </p>
                </div>
              </div>

              <div className="info-row">
                <Mail size={18} className="text-muted" />

                <div>
                  <p className="text-xs text-muted">
                    Email Address
                  </p>

                  <p className="text-sm font-medium">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="info-row">
                <Shield size={18} className="text-warning" />

                <div>
                  <p className="text-xs text-muted">
                    Account Role
                  </p>

                  <span
                    className={`route-badge badge-${
                      user.role === 'organizer'
                        ? 'organizer'
                        : 'user'
                    }`}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter style={{ justifyContent: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut size={14} />}
            >
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;