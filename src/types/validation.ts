import { z } from 'zod';

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  path: (string | number)[];
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors: ValidationError[];
}

// Zod Type Utilities
export type ZodPrimitive = z.ZodString | z.ZodNumber | z.ZodBoolean | z.ZodDate | z.ZodBigInt;

export type ZodEnum = z.ZodEnum<any> | z.ZodNativeEnum<any>;

export type ZodCollection =
  | z.ZodArray<any>
  | z.ZodObject<any>
  | z.ZodRecord<any>
  | z.ZodMap<any, any>
  | z.ZodSet<any>;

export type ZodUnion =
  | z.ZodUnion<any>
  | z.ZodDiscriminatedUnion<any, any>
  | z.ZodIntersection<any, any>;

export type ZodOptional = z.ZodOptional<any> | z.ZodNullable<any> | z.ZodDefault<any>;

// Schema Inspection Types
export interface ZodTypeInfo {
  typeName: z.ZodFirstPartyTypeKind;
  isOptional: boolean;
  isNullable: boolean;
  hasDefault: boolean;
  defaultValue?: any;
  constraints: {
    min?: number;
    max?: number;
    length?: number;
    pattern?: RegExp;
    multipleOf?: number;
    format?: string;
  };
  options?: Array<{ label: string; value: any }>;
  description?: string;
}

// Real-time Validation Types
export interface ValidationConfig {
  mode: 'onChange' | 'onBlur' | 'onSubmit';
  debounceMs?: number;
  validateOnMount?: boolean;
  abortEarly?: boolean;
}

export interface AsyncValidationResult {
  isValidating: boolean;
  error?: ValidationError;
  lastValidated?: Date;
}

// Custom Validation Types
export type CustomValidator<T = any> = (
  value: T,
  context: ValidationContext
) => Promise<string | null> | string | null;

export interface ValidationContext {
  field: string;
  formData: Record<string, any>;
  schema: z.ZodSchema;
}

export interface CustomValidationRule {
  validator: CustomValidator;
  message?: string;
  async?: boolean;
}

// Field-level Validation
export interface FieldValidation {
  required?: boolean;
  custom?: CustomValidationRule[];
  dependencies?: string[];
  validateWhen?: (formData: Record<string, any>) => boolean;
}
