import { z } from 'zod';
import { ReactNode } from 'react';
import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

// Core Zod Form Types
export type ZodSchema = z.ZodTypeAny;

// Theme Configuration
export type Theme = 'dark' | 'light' | 'auto';

export interface ThemeConfig {
  theme: Theme;
  customColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    surface?: string;
    border?: string;
    text?: string;
    textMuted?: string;
    error?: string;
    success?: string;
  };
}

// Layout Options
export type Layout = 'vertical' | 'horizontal' | 'grid';

export interface LayoutConfig {
  layout: Layout;
  columns?: number;
  spacing?: 'sm' | 'md' | 'lg';
  labelPosition?: 'top' | 'left' | 'floating';
}

// Field Types
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'tel'
  | 'number'
  | 'range'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'stars'
  | 'array'
  | 'object'
  | 'record'
  | 'switch'
  | 'color';

// Field Configuration
export interface FieldConfig {
  type?: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  hidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  defaultValue?: any;

  // Enhanced Features
  documentUpload?: boolean;
  imageUpload?: boolean;
  imagePreview?: boolean;
  accept?: string;

  // Star Rating
  maxStars?: number;
  starIcon?: string;

  // Array/Object specific
  addButtonText?: string;
  removeButtonText?: string;
  minItems?: number;
  maxItems?: number;

  // Select/Radio options
  options?: Array<{ label: string; value: string | number; disabled?: boolean }>;

  // Number inputs
  min?: number;
  max?: number;
  step?: number;

  // Text inputs
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Layout
  className?: string;
  containerClassName?: string;
  labelClassName?: string;

  // Conditional logic
  showWhen?: {
    field: string;
    value?: any;
    operator?: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  };

  // Object/Array specific
  fields?: Record<string, any>;

  // Custom render functions
  renderLabel?: (label: string) => ReactNode;
  renderDescription?: (description: string) => ReactNode;
  renderError?: (error: FieldError) => ReactNode;
}

// Form Configuration
export interface ZodFormConfig {
  schema: ZodSchema;

  // Theming
  theme?: Theme;
  themeConfig?: ThemeConfig;

  // Layout
  layout?: Layout;
  layoutConfig?: LayoutConfig;

  // Field Options
  fieldOptions?: Record<string, FieldConfig>;

  // Form Behavior
  onSubmit?: (data: any) => void | Promise<void>;
  onError?: (errors: Record<string, FieldError>) => void;
  onChange?: (data: any) => void;

  // Validation
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';

  // Form State
  defaultValues?: any;
  values?: any;

  // UI Configuration
  submitButtonText?: string;
  resetButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;

  // Loading States
  loading?: boolean;
  disabled?: boolean;

  // Custom Components
  customComponents?: Record<string, React.ComponentType<any>>;

  // Advanced Features
  autoSave?: boolean;
  autoSaveDelay?: number;

  // Accessibility
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
}

// Field Component Props
export interface FieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: FieldError;
  register: UseFormRegisterReturn;
  config: FieldConfig;
  theme: Theme;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

// Array Field Props
export interface ArrayFieldProps extends Omit<FieldProps, 'register'> {
  fields: Array<{ id: string }>;
  append: (value: any) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
  renderItem: (index: number) => ReactNode;
}

// Object Field Props
export interface ObjectFieldProps extends Omit<FieldProps, 'register'> {
  schema: z.ZodObject<any>;
  renderFields: () => ReactNode;
}

// Star Rating Props
export interface StarRatingProps extends Omit<FieldProps, 'register'> {
  value: number;
  onChange: (value: number) => void;
  maxStars: number;
  starIcon?: string;
  size?: 'sm' | 'md' | 'lg';
  allowHalf?: boolean;
}

// File Upload Props
export interface FileUploadProps extends Omit<FieldProps, 'register'> {
  value?: FileList | File[];
  onChange: (files: FileList | File[] | null) => void;
  accept?: string;
  multiple?: boolean;
  imagePreview?: boolean;
  documentUpload?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

// Conditional Logic Types
export interface ConditionalRule {
  field: string;
  value?: any;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
}

// Form State Types
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, FieldError>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Schema Analysis Types
export interface FieldAnalysis {
  name: string;
  type: FieldType;
  zodType: string;
  required: boolean;
  config: FieldConfig;
  defaultValue?: any;
}

export interface SchemaAnalysis {
  fields: FieldAnalysis[];
  hasArrays: boolean;
  hasObjects: boolean;
  hasConditionals: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type FormData<T extends ZodSchema> = z.infer<T>;

// Export all types for easy importing
export * from './validation';
export * from './components';
