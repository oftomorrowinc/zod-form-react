import React from 'react';
import { InputProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, error, leftIcon, rightIcon, leftAddon, rightAddon, disabled, readOnly, ...props },
    ref
  ) => {
    const hasError = !!error;
    const hasLeftAddon = !!leftIcon || !!leftAddon;
    const hasRightAddon = !!rightIcon || !!rightAddon;

    const inputClasses = cn(
      themeClasses.input.base,
      hasError && themeClasses.input.error,
      disabled && themeClasses.input.disabled,
      readOnly && themeClasses.input.readOnly,
      hasLeftAddon && 'pl-10',
      hasRightAddon && 'pr-10',
      className
    );

    if (hasLeftAddon || hasRightAddon) {
      return (
        <div className="relative">
          {hasLeftAddon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon || leftAddon}
            </div>
          )}

          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            readOnly={readOnly}
            {...props}
          />

          {hasRightAddon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon || rightAddon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={inputClasses}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
