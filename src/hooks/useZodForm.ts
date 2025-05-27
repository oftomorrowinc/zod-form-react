import { useForm, UseFormProps, UseFormReturn, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useCallback } from 'react';
import { ZodFormConfig, FormData, FieldAnalysis, SchemaAnalysis } from '../types';
import {
  parseSchema,
  analyzeSchema,
  generateDefaultValues,
  validateWithSchema,
} from '../utils/schema-parser';

interface UseZodFormOptions<T extends z.ZodTypeAny>
  extends Omit<UseFormProps<FormData<T>>, 'resolver'> {
  schema: T;
  onSubmit?: (data: FormData<T>) => void | Promise<void>;
  onError?: (errors: any) => void;
}

interface UseZodFormReturn<T extends z.ZodTypeAny> extends UseFormReturn<FormData<T>> {
  schema: T;
  fields: Record<string, FieldAnalysis>;
  schemaAnalysis: SchemaAnalysis;
  isSubmitting: boolean;
  submitForm: (e?: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  validateField: (name: string, value: any) => Promise<string | undefined>;
  getFieldConfig: (name: string) => FieldAnalysis | undefined;
}

export function useZodForm<T extends z.ZodTypeAny>({
  schema,
  onSubmit,
  onError,
  defaultValues,
  mode = 'onChange',
  ...formOptions
}: UseZodFormOptions<T>): UseZodFormReturn<T> {
  // Generate default values from schema if not provided
  const computedDefaultValues = useMemo(() => {
    if (defaultValues) return defaultValues;
    return generateDefaultValues(schema);
  }, [schema, defaultValues]);

  // Parse schema into field definitions
  const fields = useMemo(() => parseSchema(schema), [schema]);

  // Analyze schema complexity and features
  const schemaAnalysis = useMemo(() => analyzeSchema(schema), [schema]);

  // Initialize React Hook Form with Zod resolver
  const form = useForm<FormData<T>>({
    resolver: zodResolver(schema),
    defaultValues: computedDefaultValues as DefaultValues<FormData<T>>,
    mode,
    ...formOptions,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    trigger,
    getValues,
  } = form;

  // Submit handler
  const submitForm = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      await handleSubmit(
        async data => {
          try {
            await onSubmit?.(data);
          } catch (error) {
            console.error('Form submission error:', error);
            onError?.(error);
          }
        },
        errors => {
          onError?.(errors);
        }
      )();
    },
    [handleSubmit, onSubmit, onError]
  );

  // Reset form to default values
  const resetForm = useCallback(() => {
    reset(computedDefaultValues);
  }, [reset, computedDefaultValues]);

  // Validate individual field
  const validateField = useCallback(
    async (name: string, value: any): Promise<string | undefined> => {
      try {
        // Get the field's schema
        const fieldSchema = getFieldSchema(schema, name);
        if (!fieldSchema) return undefined;

        // Validate the value
        const result = validateWithSchema(fieldSchema, value);
        if (!result.success && result.errors.length > 0) {
          return result.errors[0].message;
        }

        return undefined;
      } catch (error) {
        return 'Validation error';
      }
    },
    [schema]
  );

  // Get field configuration
  const getFieldConfig = useCallback(
    (name: string): FieldAnalysis | undefined => {
      return fields[name];
    },
    [fields]
  );

  return {
    ...form,
    schema,
    fields,
    schemaAnalysis,
    isSubmitting,
    submitForm,
    resetForm,
    validateField,
    getFieldConfig,
  };
}

// Helper function to extract field schema from object schema
function getFieldSchema(schema: z.ZodTypeAny, fieldName: string): z.ZodTypeAny | undefined {
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    return shape[fieldName];
  }
  return undefined;
}

// Hook for conditional field visibility
export function useConditionalFields(
  fields: Record<string, FieldAnalysis>,
  formValues: Record<string, any>
) {
  return useMemo(() => {
    const visibleFields: Record<string, boolean> = {};

    Object.entries(fields).forEach(([name, field]) => {
      if (!field.config.showWhen) {
        visibleFields[name] = true;
        return;
      }

      const {
        field: dependentField,
        value: expectedValue,
        operator = 'equals',
      } = field.config.showWhen;
      const actualValue = formValues[dependentField];

      let isVisible = false;

      switch (operator) {
        case 'equals':
          isVisible = actualValue === expectedValue;
          break;
        case 'not-equals':
          isVisible = actualValue !== expectedValue;
          break;
        case 'contains':
          isVisible = Array.isArray(actualValue)
            ? actualValue.includes(expectedValue)
            : String(actualValue).includes(String(expectedValue));
          break;
        case 'greater-than':
          isVisible = Number(actualValue) > Number(expectedValue);
          break;
        case 'less-than':
          isVisible = Number(actualValue) < Number(expectedValue);
          break;
        default:
          isVisible = true;
      }

      visibleFields[name] = isVisible;
    });

    return visibleFields;
  }, [fields, formValues]);
}

// Hook for managing array fields
export function useArrayField<T = any>(name: string, form: UseFormReturn<any>) {
  const { control, getValues, setValue, trigger } = form;

  const append = useCallback(
    (value: T) => {
      const currentValues = getValues(name) || [];
      const newValues = [...currentValues, value];
      setValue(name, newValues);
      trigger(name);
    },
    [name, getValues, setValue, trigger]
  );

  const remove = useCallback(
    (index: number) => {
      const currentValues = getValues(name) || [];
      const newValues = currentValues.filter((_: any, i: number) => i !== index);
      setValue(name, newValues);
      trigger(name);
    },
    [name, getValues, setValue, trigger]
  );

  const move = useCallback(
    (from: number, to: number) => {
      const currentValues = getValues(name) || [];
      const newValues = [...currentValues];
      const [movedItem] = newValues.splice(from, 1);
      newValues.splice(to, 0, movedItem);
      setValue(name, newValues);
      trigger(name);
    },
    [name, getValues, setValue, trigger]
  );

  const items = getValues(name) || [];

  return {
    items: items.map((item: T, index: number) => ({ id: `${name}-${index}`, ...item })),
    append,
    remove,
    move,
  };
}
