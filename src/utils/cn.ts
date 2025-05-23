import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Theme-aware class name utility
 */
export const themeClasses = {
  // Base form styles
  form: 'space-y-6',

  // Field containers
  fieldContainer: 'space-y-2',
  fieldGroup: 'space-y-4',

  // Labels
  label: {
    base: 'block text-sm font-medium text-zf-text',
    required: "after:content-['*'] after:ml-0.5 after:text-zf-error",
    optional: 'text-zf-text-muted',
  },

  // Input styles
  input: {
    base: 'block w-full rounded-md border-zf-border bg-zf-surface px-3 py-2 text-zf-text placeholder-zf-text-muted focus:border-zf-primary focus:outline-none focus:ring-1 focus:ring-zf-primary',
    error: 'border-zf-error focus:border-zf-error focus:ring-zf-error',
    disabled: 'opacity-50 cursor-not-allowed bg-zf-surface/50',
    readOnly: 'bg-zf-surface/30 cursor-default',
  },

  // Textarea styles
  textarea: {
    base: 'block w-full rounded-md border-zf-border bg-zf-surface px-3 py-2 text-zf-text placeholder-zf-text-muted focus:border-zf-primary focus:outline-none focus:ring-1 focus:ring-zf-primary resize-vertical',
    error: 'border-zf-error focus:border-zf-error focus:ring-zf-error',
  },

  // Select styles
  select: {
    base: 'block w-full rounded-md border-zf-border bg-zf-surface px-3 py-2 text-zf-text focus:border-zf-primary focus:outline-none focus:ring-1 focus:ring-zf-primary',
    error: 'border-zf-error focus:border-zf-error focus:ring-zf-error',
  },

  // Checkbox and radio styles
  checkbox: {
    base: 'h-4 w-4 rounded border-zf-border bg-zf-surface text-zf-primary focus:ring-zf-primary focus:ring-2 focus:ring-offset-0',
    error: 'border-zf-error',
  },

  radio: {
    base: 'h-4 w-4 border-zf-border bg-zf-surface text-zf-primary focus:ring-zf-primary focus:ring-2 focus:ring-offset-0',
    error: 'border-zf-error',
  },

  // Button styles
  button: {
    primary:
      'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-zf-primary hover:bg-zf-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zf-primary disabled:opacity-50 disabled:cursor-not-allowed',
    secondary:
      'inline-flex items-center px-4 py-2 border border-zf-border text-sm font-medium rounded-md text-zf-text bg-zf-surface hover:bg-zf-surface/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zf-primary disabled:opacity-50 disabled:cursor-not-allowed',
    outline:
      'inline-flex items-center px-4 py-2 border border-zf-border text-sm font-medium rounded-md text-zf-text hover:bg-zf-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zf-primary disabled:opacity-50 disabled:cursor-not-allowed',
    ghost:
      'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-zf-text hover:bg-zf-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zf-primary disabled:opacity-50 disabled:cursor-not-allowed',
    link: 'inline-flex items-center text-sm font-medium text-zf-primary hover:text-zf-primary/80 focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed',
  },

  // Error message styles
  error: {
    base: 'text-sm text-zf-error animate-fade-in',
    icon: 'h-4 w-4 text-zf-error',
  },

  // Description styles
  description: {
    base: 'text-sm text-zf-text-muted',
  },

  // Array field styles
  array: {
    container: 'space-y-4 border border-zf-border rounded-lg p-4',
    item: 'relative border border-zf-border/50 rounded-md p-4',
    addButton:
      'w-full border-2 border-dashed border-zf-border hover:border-zf-primary rounded-md p-4 text-zf-text-muted hover:text-zf-text transition-colors',
    removeButton: 'absolute top-2 right-2 text-zf-error hover:text-zf-error/80',
  },

  // Object field styles
  object: {
    container: 'space-y-4 border border-zf-border rounded-lg p-4',
    header: 'flex items-center justify-between pb-2 border-b border-zf-border',
    content: 'pt-4 space-y-4',
  },

  // File upload styles
  fileUpload: {
    container:
      'border-2 border-dashed border-zf-border rounded-lg p-6 text-center hover:border-zf-primary transition-colors',
    active: 'border-zf-primary bg-zf-primary/10',
    preview: 'mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
    previewItem: 'relative rounded-lg overflow-hidden border border-zf-border',
  },

  // Star rating styles
  stars: {
    container: 'flex items-center space-x-1',
    star: 'h-5 w-5 cursor-pointer transition-colors duration-150',
    filled: 'text-yellow-400',
    empty: 'text-zf-border hover:text-yellow-400/50',
  },

  // Loading states
  loading: {
    spinner: 'animate-spin h-4 w-4 border-2 border-zf-primary border-t-transparent rounded-full',
    overlay: 'absolute inset-0 bg-zf-background/50 flex items-center justify-center',
  },

  // Animation classes
  animations: {
    fadeIn: 'animate-fade-in',
    slideDown: 'animate-slide-down',
    starPulse: 'animate-star-pulse',
  },
} as const;

/**
 * Get theme-specific classes
 */
export const getThemeClasses = (theme: 'dark' | 'light' | 'auto' = 'dark') => {
  const resolvedTheme = theme === 'auto' ? 'dark' : theme; // Default auto to dark for now

  return {
    root: resolvedTheme === 'dark' ? 'dark' : '',
    background: resolvedTheme === 'dark' ? 'bg-zf-background' : 'bg-white',
    text: resolvedTheme === 'dark' ? 'text-zf-text' : 'text-gray-900',
  };
};

/**
 * Size variant utilities
 */
export const sizeVariants = {
  sm: {
    input: 'px-2 py-1 text-sm',
    button: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    input: 'px-3 py-2 text-sm',
    button: 'px-4 py-2 text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    input: 'px-4 py-3 text-base',
    button: 'px-6 py-3 text-base',
    icon: 'h-5 w-5',
  },
} as const;

/**
 * Responsive utilities
 */
export const responsive = {
  container: 'w-full max-w-2xl mx-auto',
  grid: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
  spacing: {
    sm: 'space-y-2 space-x-2',
    md: 'space-y-4 space-x-4',
    lg: 'space-y-6 space-x-6',
  },
} as const;
