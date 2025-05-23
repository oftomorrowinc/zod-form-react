import React from 'react';
import { ErrorMessageProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  show = true,
  className,
  ...props
}) => {
  if (!error || !show) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div
      className={cn(themeClasses.error.base, className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-center space-x-1">
        <svg
          className={themeClasses.error.icon}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{errorMessage}</span>
      </div>
    </div>
  );
};
