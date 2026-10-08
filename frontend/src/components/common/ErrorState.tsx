import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this content. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <div className="error-icon-wrapper">
        <AlertCircle size={32} className="error-icon" />
      </div>
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{message}</p>
      {onRetry && (
        <div className="error-action">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw size={14} />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
