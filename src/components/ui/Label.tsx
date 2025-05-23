import React from 'react';
import { LabelProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, size = 'md', position = 'top', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          themeClasses.label.base,
          required && themeClasses.label.required,
          position === 'floating' && 'absolute -top-2 left-2 bg-zf-surface px-1 text-xs',
          size === 'sm' && 'text-xs',
          size === 'lg' && 'text-base',
          className
        )}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';
