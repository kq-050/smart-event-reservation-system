import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
}) => {
  const iconSizes = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  return (
    <div
      className={`loading-state ${fullPage ? 'loading-state-full' : ''}`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="animate-spin loading-spinner"
        size={iconSizes[size]}
      />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingState;
