import React, { useState } from 'react';
import { ObjectFieldProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const ObjectField = React.forwardRef<HTMLDivElement, ObjectFieldProps>(
  (
    {
      className,
      name,
      label,
      description,
      error,
      children,
      collapsible = false,
      defaultExpanded = true,
      showBorder = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasError = !!error;

    const toggleExpanded = () => {
      if (collapsible && !disabled) {
        setIsExpanded(!isExpanded);
      }
    };

    const containerClasses = cn(
      'space-y-4',
      showBorder && themeClasses.object.container,
      hasError && 'border-zf-error',
      className
    );

    const headerClasses = cn(
      themeClasses.object.header,
      collapsible && !disabled && 'cursor-pointer hover:bg-zf-surface/50',
      !showBorder && 'border-b-0 pb-0'
    );

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {/* Object Header */}
        {(label || description || collapsible) && (
          <div className={headerClasses} onClick={toggleExpanded}>
            <div className="flex-1">
              {label && (
                <h3 className="text-sm font-medium text-zf-text flex items-center">
                  {label}
                  {hasError && (
                    <svg
                      className="ml-2 h-4 w-4 text-zf-error"
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
                  )}
                </h3>
              )}
              {description && <p className="text-xs text-zf-text-muted mt-1">{description}</p>}
            </div>

            {collapsible && (
              <button
                type="button"
                className="p-1 text-zf-text-muted hover:text-zf-text transition-colors"
                disabled={disabled}
                aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Object Content */}
        {(!collapsible || isExpanded) && (
          <div
            className={cn(
              themeClasses.object.content,
              collapsible && 'animate-slide-down',
              !showBorder && 'pt-0'
            )}
          >
            {children}
          </div>
        )}

        {/* Collapsed State Indicator */}
        {collapsible && !isExpanded && (
          <div className="text-xs text-zf-text-muted italic">Click to expand...</div>
        )}
      </div>
    );
  }
);

ObjectField.displayName = 'ObjectField';
