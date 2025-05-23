import React from 'react';
import { DescriptionProps } from '../../types/components';
import { cn, themeClasses } from '../../utils/cn';

export const Description: React.FC<DescriptionProps> = ({ children, className, ...props }) => {
  if (!children) return null;

  return (
    <div className={cn(themeClasses.description.base, className)} {...props}>
      {children}
    </div>
  );
};
