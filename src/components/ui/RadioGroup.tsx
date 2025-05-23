import React from 'react';
import { RadioGroupProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      name,
      options,
      orientation = 'vertical',
      value,
      onChange,
      disabled,
      error,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const containerClasses = cn(
      'space-y-2',
      orientation === 'horizontal' && 'flex flex-wrap gap-4 space-y-0',
      className
    );

    return (
      <div ref={ref} className={containerClasses} role="radiogroup" {...props}>
        {options.map(option => (
          <label
            key={String(option.value)}
            className={cn(
              'flex items-start space-x-3 cursor-pointer',
              (disabled || option.disabled) && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={e => onChange?.(e.target.value)}
              disabled={disabled || option.disabled}
              className={cn(
                themeClasses.radio.base,
                hasError && themeClasses.radio.error,
                'mt-0.5 flex-shrink-0'
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zf-text">{option.label}</div>
              {option.description && (
                <div className="text-sm text-zf-text-muted mt-1">{option.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
