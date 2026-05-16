import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ObjectFieldProps {
  name: string;
  label?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showBorder?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ObjectField = React.forwardRef<HTMLDivElement, ObjectFieldProps>(
  (
    {
      name,
      label,
      description,
      children,
      collapsible = false,
      defaultExpanded = true,
      showBorder = true,
      disabled,
      className,
    },
    ref,
  ) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const toggle = () => {
      if (collapsible && !disabled) setExpanded((v) => !v);
    };

    return (
      <div
        ref={ref}
        data-field={name}
        className={cn('space-y-3', showBorder && 'rounded-md border bg-card p-4', className)}
      >
        {(label || description) && (
          <div
            className={cn(
              'flex items-start justify-between',
              collapsible && !disabled && 'cursor-pointer',
            )}
            onClick={toggle}
          >
            <div className="space-y-1">
              {label && <div className="text-sm font-medium">{label}</div>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {collapsible && (
              <button
                type="button"
                aria-label={expanded ? 'Collapse' : 'Expand'}
                aria-expanded={expanded}
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                  aria-hidden
                />
              </button>
            )}
          </div>
        )}
        {(!collapsible || expanded) && <div className="space-y-3">{children}</div>}
      </div>
    );
  },
);
ObjectField.displayName = 'ObjectField';
