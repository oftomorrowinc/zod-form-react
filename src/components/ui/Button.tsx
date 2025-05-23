import React from 'react';
import { ButtonProps } from '../../types/components';
import { cn, themeClasses, sizeVariants } from '../../utils/cn';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = cn(
      themeClasses.button[variant],
      size === 'sm' && sizeVariants.sm.button,
      size === 'lg' && sizeVariants.lg.button,
      isDisabled && 'cursor-not-allowed opacity-50',
      className
    );

    return (
      <button ref={ref} className={buttonClasses} disabled={isDisabled} {...props}>
        {loading && <div className={cn(themeClasses.loading.spinner, 'mr-2')} />}

        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}

        {children}

        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
