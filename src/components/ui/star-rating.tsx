import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  (
    { value = 0, onChange, max = 5, disabled = false, readOnly = false, className, ...ariaProps },
    ref,
  ) => {
    const [hovered, setHovered] = React.useState<number | null>(null);
    const display = hovered ?? value;
    const interactive = !disabled && !readOnly;

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="rating"
        className={cn('flex items-center gap-1', className)}
        {...ariaProps}
      >
        {Array.from({ length: max }, (_, i) => {
          const v = i + 1;
          const filled = display >= v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={value === v}
              aria-label={`${v} star${v === 1 ? '' : 's'}`}
              disabled={disabled}
              tabIndex={interactive ? 0 : -1}
              onClick={() => interactive && onChange?.(v)}
              onMouseEnter={() => interactive && setHovered(v)}
              onMouseLeave={() => interactive && setHovered(null)}
              onFocus={() => interactive && setHovered(v)}
              onBlur={() => interactive && setHovered(null)}
              className={cn(
                'rounded transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                interactive && 'hover:scale-110',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Star
                className={cn(
                  'h-5 w-5',
                  filled ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground',
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    );
  },
);
StarRating.displayName = 'StarRating';

export { StarRating };
