import React, { useState, useCallback } from 'react';
import { StarRatingProps } from '../../types/components';
import { cn, themeClasses, sizeVariants } from '../../utils/cn';

export const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  (
    {
      className,
      name,
      value = 0,
      onChange,
      maxStars = 5,
      allowHalf = false,
      size = 'md',
      starIcon,
      emptyStarIcon,
      halfStarIcon,
      readonly = false,
      showValue = false,
      precision = allowHalf ? 0.5 : 1,
      disabled,
      error,
      ...props
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const hasError = !!error;

    const getStarValue = useCallback((index: number, position?: 'full' | 'half') => {
      if (position === 'half') {
        return index + 0.5;
      }
      return index + 1;
    }, []);

    const handleMouseEnter = useCallback(
      (starValue: number) => {
        if (!readonly && !disabled) {
          setHoverValue(starValue);
        }
      },
      [readonly, disabled]
    );

    const handleMouseLeave = useCallback(() => {
      if (!readonly && !disabled) {
        setHoverValue(null);
      }
    }, [readonly, disabled]);

    const handleClick = useCallback(
      (starValue: number) => {
        if (!readonly && !disabled && onChange) {
          onChange(starValue);
        }
      },
      [readonly, disabled, onChange]
    );

    const displayValue = hoverValue !== null ? hoverValue : value;

    const containerClasses = cn(
      themeClasses.stars.container,
      disabled && 'opacity-50 cursor-not-allowed',
      readonly && 'cursor-default',
      className
    );

    const getStarClasses = (index: number) => {
      const starValue = index + 1;
      const halfStarValue = index + 0.5;

      let filled = false;
      let halfFilled = false;

      if (allowHalf) {
        if (displayValue >= starValue) {
          filled = true;
        } else if (displayValue >= halfStarValue) {
          halfFilled = true;
        }
      } else {
        filled = displayValue >= starValue;
      }

      return cn(
        themeClasses.stars.star,
        filled && themeClasses.stars.filled,
        !filled && !halfFilled && themeClasses.stars.empty,
        size === 'sm' && 'h-4 w-4',
        size === 'lg' && 'h-6 w-6',
        !readonly && !disabled && 'hover:scale-110 active:animate-star-pulse'
      );
    };

    const renderStar = (index: number) => {
      const starValue = index + 1;
      const halfStarValue = index + 0.5;
      const isHalfFilled = allowHalf && displayValue >= halfStarValue && displayValue < starValue;

      if (starIcon || emptyStarIcon || halfStarIcon) {
        if (displayValue >= starValue && starIcon) {
          return starIcon;
        } else if (isHalfFilled && halfStarIcon) {
          return halfStarIcon;
        } else if (emptyStarIcon) {
          return emptyStarIcon;
        }
      }

      // Default star rendering
      if (isHalfFilled) {
        return (
          <div className="relative">
            <svg className="h-full w-full text-zf-border" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <svg
                className="h-full w-full text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        );
      }

      return (
        <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    };

    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)} {...props}>
        <div className={containerClasses} onMouseLeave={handleMouseLeave}>
          {Array.from({ length: maxStars }, (_, index) => (
            <div key={index} className="relative">
              <button
                type="button"
                className={getStarClasses(index)}
                onMouseEnter={() => handleMouseEnter(getStarValue(index, 'full'))}
                onClick={() => handleClick(getStarValue(index, 'full'))}
                disabled={disabled || readonly}
                aria-label={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
              >
                {renderStar(index)}
              </button>

              {allowHalf && !readonly && !disabled && (
                <button
                  type="button"
                  className="absolute inset-0 w-1/2 bg-transparent"
                  onMouseEnter={() => handleMouseEnter(getStarValue(index, 'half'))}
                  onClick={() => handleClick(getStarValue(index, 'half'))}
                  aria-label={`Rate ${index + 0.5} stars`}
                />
              )}
            </div>
          ))}
        </div>

        {showValue && (
          <span className="text-sm text-zf-text-muted ml-2">
            {value > 0 ? `${value}/${maxStars}` : 'Not rated'}
          </span>
        )}

        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={value} />
      </div>
    );
  }
);

StarRating.displayName = 'StarRating';
