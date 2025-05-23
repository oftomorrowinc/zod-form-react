import {
  ReactNode,
  HTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import { FieldError } from 'react-hook-form';

// Base Component Props
export interface BaseFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: FieldError;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  'data-testid'?: string;
}

// Input Component Props
export interface InputProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'className'> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

// Textarea Component Props
export interface TextareaProps
  extends BaseFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'className'> {
  rows?: number;
  autoResize?: boolean;
  maxRows?: number;
  documentUpload?: boolean;
  onDocumentUpload?: (text: string) => void;
}

// Select Component Props
export interface SelectProps
  extends BaseFieldProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'className'> {
  options: Array<{
    label: string;
    value: string | number;
    disabled?: boolean;
    group?: string;
  }>;
  emptyOption?: string;
  searchable?: boolean;
  creatable?: boolean;
  onCreateOption?: (inputValue: string) => void;
}

// Radio Group Props
export interface RadioGroupProps extends BaseFieldProps {
  options: Array<{
    label: string;
    value: string | number;
    disabled?: boolean;
    description?: string;
  }>;
  orientation?: 'horizontal' | 'vertical';
  value?: string | number;
  onChange?: (value: string | number) => void;
}

// Checkbox Props
export interface CheckboxProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'className' | 'size'> {
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Switch Props
export interface SwitchProps extends BaseFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

// File Upload Props
export interface FileUploadProps extends BaseFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  imagePreview?: boolean;
  documentUpload?: boolean;
  value?: File[] | FileList;
  onChange?: (files: File[] | FileList | null) => void;
  onError?: (error: string) => void;
  uploadEndpoint?: string;
  uploadHeaders?: Record<string, string>;
}

// Star Rating Props
export interface StarRatingProps extends BaseFieldProps {
  maxStars?: number;
  allowHalf?: boolean;
  size?: 'sm' | 'md' | 'lg';
  starIcon?: ReactNode;
  emptyStarIcon?: ReactNode;
  halfStarIcon?: ReactNode;
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  showValue?: boolean;
  precision?: number;
}

// Date/Time Props
export interface DateTimeProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'className'> {
  type: 'date' | 'datetime-local' | 'time' | 'month' | 'week';
  showTimeZone?: boolean;
  format?: string;
  locale?: string;
}

// Number/Range Props
export interface NumberProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'className'> {
  type: 'number' | 'range';
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  unit?: string;
}

// Color Picker Props
export interface ColorProps extends BaseFieldProps {
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: string[];
  alpha?: boolean;
  value?: string;
  onChange?: (color: string) => void;
}

// Array Field Props
export interface ArrayFieldProps extends BaseFieldProps {
  items: Array<{ id: string; [key: string]: any }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  renderItem: (item: any, index: number) => ReactNode;
  addButtonText?: string;
  removeButtonText?: string;
  minItems?: number;
  maxItems?: number;
  sortable?: boolean;
  collapsible?: boolean;
}

// Object Field Props
export interface ObjectFieldProps extends BaseFieldProps {
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showBorder?: boolean;
}

// Form Section Props
export interface FormSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
}

// Form Group Props
export interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

// Label Props
export interface LabelProps extends HTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  position?: 'top' | 'left' | 'floating';
  size?: 'sm' | 'md' | 'lg';
}

// Error Message Props
export interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  error?: FieldError | string;
  show?: boolean;
}

// Description Props
export interface DescriptionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Button Props
export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}
