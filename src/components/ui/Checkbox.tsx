import React from 'react';
import { CheckboxProps } from '../../types/components';
import { cn, themeClasses, sizeVariants } from '../../utils/cn';

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, error, size = 'md', indeterminate = false, disabled, ...props }, ref) => {
    const hasError = !!error;

    React.useEffect(() => {
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [ref, indeterminate]);

    const checkboxClasses = cn(
      themeClasses.checkbox.base,
      hasError && themeClasses.checkbox.error,
      disabled && 'opacity-50 cursor-not-allowed',
      size === 'sm' && 'h-3 w-3',
      size === 'lg' && 'h-5 w-5',
      className
    );

    return (
      <input ref={ref} type="checkbox" className={checkboxClasses} disabled={disabled} {...props} />
    );
  }
);

Checkbox.displayName = 'Checkbox';
