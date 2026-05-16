import { useCallback, useMemo } from 'react';
import {
  type DefaultValues,
  type Resolver,
  useForm,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  analyzeSchema,
  generateDefaultValues,
  getObjectShape,
  parseSchema,
  validateWithSchema,
} from '../utils/schema-parser';
import type { FieldAnalysis, SchemaAnalysis } from '../types';

// Internally we always work in `Record<string, unknown>` because `z.infer<T>`
// of an arbitrary ZodTypeAny widens to `unknown`, which isn't a `FieldValues`.
// At the public boundary, consumers' `onSubmit` callback gets `z.infer<T>`.
export type FormValues = Record<string, unknown>;

interface UseZodFormOptions<T extends z.ZodTypeAny> extends Omit<
  UseFormProps<FormValues>,
  'resolver'
> {
  schema: T;
  onSubmit?: (data: z.infer<T>) => void | Promise<void>;
  onError?: (errors: unknown) => void;
}

export interface UseZodFormReturn<T extends z.ZodTypeAny> extends UseFormReturn<FormValues> {
  schema: T;
  fields: Record<string, FieldAnalysis>;
  schemaAnalysis: SchemaAnalysis;
  isSubmitting: boolean;
  submitForm: (e?: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  validateField: (name: string, value: unknown) => Promise<string | undefined>;
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
  const computedDefaults = useMemo(() => {
    if (defaultValues) return defaultValues;
    return generateDefaultValues(schema);
  }, [schema, defaultValues]);

  const fields = useMemo(() => parseSchema(schema), [schema]);
  const schemaAnalysis = useMemo(() => analyzeSchema(schema), [schema]);

  const form = useForm<FormValues>({
    // zodResolver's signature is parametric on the schema's input/output. We
    // accept any ZodTypeAny upstream, so we erase the schema type at the
    // resolver boundary — runtime parsing is what's load-bearing.
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]) as Resolver<FormValues>,
    defaultValues: computedDefaults as DefaultValues<FormValues>,
    mode,
    ...formOptions,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  const submitForm = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      await handleSubmit(
        async (data) => {
          try {
            await onSubmit?.(data as z.infer<T>);
          } catch (err) {
            onError?.(err);
          }
        },
        (errors) => onError?.(errors),
      )();
    },
    [handleSubmit, onSubmit, onError],
  );

  const resetForm = useCallback(() => {
    reset(computedDefaults as DefaultValues<FormValues>);
  }, [reset, computedDefaults]);

  const validateField = useCallback(
    async (name: string, value: unknown): Promise<string | undefined> => {
      const fieldSchema = getObjectShape(schema)[name];
      if (!fieldSchema) return undefined;
      const result = validateWithSchema(fieldSchema, value);
      if (!result.success && result.errors.length) return result.errors[0]?.message;
      return undefined;
    },
    [schema],
  );

  const getFieldConfig = useCallback(
    (name: string): FieldAnalysis | undefined => fields[name],
    [fields],
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

export function useConditionalFields(
  fields: Record<string, FieldAnalysis>,
  formValues: Record<string, unknown>,
) {
  return useMemo(() => {
    const visible: Record<string, boolean> = {};
    for (const [name, field] of Object.entries(fields)) {
      const cond = field.config.showWhen;
      if (!cond) {
        visible[name] = true;
        continue;
      }
      const actual = formValues[cond.field];
      const expected = cond.value;
      switch (cond.operator ?? 'equals') {
        case 'equals':
          visible[name] = actual === expected;
          break;
        case 'not-equals':
          visible[name] = actual !== expected;
          break;
        case 'contains':
          visible[name] = Array.isArray(actual)
            ? actual.includes(expected)
            : String(actual).includes(String(expected));
          break;
        case 'greater-than':
          visible[name] = Number(actual) > Number(expected);
          break;
        case 'less-than':
          visible[name] = Number(actual) < Number(expected);
          break;
        default:
          visible[name] = true;
      }
    }
    return visible;
  }, [fields, formValues]);
}

export function useArrayField<T extends Record<string, unknown> = Record<string, unknown>>(
  name: string,
  form: UseFormReturn<FormValues>,
) {
  const { getValues, setValue, trigger } = form;

  const append = useCallback(
    (value: T) => {
      const current = (getValues(name) as T[] | undefined) ?? [];
      setValue(name, [...current, value]);
      void trigger(name);
    },
    [name, getValues, setValue, trigger],
  );

  const remove = useCallback(
    (index: number) => {
      const current = (getValues(name) as T[] | undefined) ?? [];
      setValue(
        name,
        current.filter((_, i) => i !== index),
      );
      void trigger(name);
    },
    [name, getValues, setValue, trigger],
  );

  const move = useCallback(
    (from: number, to: number) => {
      const current = (getValues(name) as T[] | undefined) ?? [];
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (moved !== undefined) next.splice(to, 0, moved);
      setValue(name, next);
      void trigger(name);
    },
    [name, getValues, setValue, trigger],
  );

  const items = ((getValues(name) as T[] | undefined) ?? []).map((item, index) => ({
    id: `${name}-${index}`,
    ...item,
  }));

  return { items, append, remove, move };
}
