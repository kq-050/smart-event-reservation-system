import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-icon">
        <Compass size={64} />
      </div>
      <h1 className="not-found-code">404</h1>
      <h2 className="not-found-title">Page Not Found</h2>
      <p className="not-found-desc">
        The route you requested does not exist or may have been moved.
      </p>
      <div className="not-found-actions">
        <Link to="/">
          <Button leftIcon={<Home size={16} />}>
            Back to Home
          </Button>
        </Link>
        <Link to="/events">
          <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
            Browse Events
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
