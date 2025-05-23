import React from 'react';
import { SwitchProps } from '../../types/components';
import { cn } from '../../utils/cn';

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      name,
      checked = false,
      onChange,
      disabled = false,
      size = 'md',
      color = 'primary',
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const switchClasses = cn(
      'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Size variants
      size === 'sm' && 'h-5 w-9',
      size === 'md' && 'h-6 w-11',
      size === 'lg' && 'h-7 w-14',
      // Color variants when checked
      checked && color === 'primary' && 'bg-zf-primary focus:ring-zf-primary',
      checked && color === 'secondary' && 'bg-zf-secondary focus:ring-zf-secondary',
      checked && color === 'success' && 'bg-zf-success focus:ring-zf-success',
      checked && color === 'warning' && 'bg-yellow-500 focus:ring-yellow-500',
      checked && color === 'error' && 'bg-zf-error focus:ring-zf-error',
      // Unchecked state
      !checked && 'bg-zf-border',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    const thumbClasses = cn(
      'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
      // Size variants
      size === 'sm' && 'h-4 w-4',
      size === 'md' && 'h-5 w-5',
      size === 'lg' && 'h-6 w-6',
      // Position based on checked state
      checked && size === 'sm' && 'translate-x-4',
      checked && size === 'md' && 'translate-x-5',
      checked && size === 'lg' && 'translate-x-7',
      !checked && 'translate-x-0'
    );

    return (
      <>
        <button
          ref={ref}
          type="button"
          className={switchClasses}
          role="switch"
          aria-checked={checked}
          onClick={handleClick}
          disabled={disabled}
          {...props}
        >
          <span className={thumbClasses} />
        </button>

        {/* Hidden input for form submission */}
        {name && <input type="hidden" name={name} value={checked ? '1' : '0'} />}
      </>
    );
  }
);

Switch.displayName = 'Switch';
