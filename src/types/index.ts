import type { ReactNode } from 'react';
import type { FieldError } from 'react-hook-form';
import type { z } from 'zod';

export type ZodSchema = z.ZodTypeAny;

export type Theme = 'dark' | 'light' | 'auto';

export type Layout = 'vertical' | 'horizontal' | 'grid';

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
  | 'switch'
  | 'file'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'stars'
  | 'array'
  | 'object'
  | 'record';

export interface FieldConfig {
  type?: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  hidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  defaultValue?: unknown;

  options?: Array<{ label: string; value: string | number; disabled?: boolean }>;

  min?: number;
  max?: number;
  step?: number;

  minLength?: number;
  maxLength?: number;
  pattern?: string;

  minItems?: number;
  maxItems?: number;
  addButtonText?: string;
  removeButtonText?: string;

  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;

  maxStars?: number;

  rows?: number;

  className?: string;
  containerClassName?: string;

  showWhen?: {
    field: string;
    value?: unknown;
    operator?: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  };

  fields?: Record<string, FieldConfig>;

  renderLabel?: (label: string) => ReactNode;
  renderDescription?: (description: string) => ReactNode;
  renderError?: (error: FieldError) => ReactNode;
}

export interface ZodFormConfig {
  theme?: Theme;
  layout?: Layout;

  fieldOptions?: Record<string, FieldConfig>;

  onError?: (errors: Record<string, FieldError>) => void;
  onChange?: (data: Record<string, unknown>) => void;

  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';

  defaultValues?: Record<string, unknown>;

  submitButtonText?: string;
  resetButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;

  loading?: boolean;
  disabled?: boolean;
}

export interface FieldAnalysis {
  name: string;
  type: FieldType;
  zodType: string;
  required: boolean;
  config: FieldConfig;
  defaultValue?: unknown;
}

export interface SchemaAnalysis {
  fields: FieldAnalysis[];
  hasArrays: boolean;
  hasObjects: boolean;
  hasConditionals: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  path: (string | number)[];
}

export interface ZodTypeInfo {
  typeName: string;
  isOptional: boolean;
  isNullable: boolean;
  hasDefault: boolean;
  defaultValue?: unknown;
  constraints: {
    min?: number;
    max?: number;
    length?: number;
    pattern?: RegExp;
    multipleOf?: number;
    format?: string;
  };
  options?: Array<{ label: string; value: unknown }>;
  description?: string;
}

export type FormData<T extends ZodSchema> = z.infer<T>;
