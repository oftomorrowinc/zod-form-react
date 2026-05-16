import * as React from 'react';
import {
  Controller,
  type ControllerRenderProps,
  type FieldErrors,
  type FieldValues,
  FormProvider,
  type UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';
import {
  type FormValues,
  useArrayField,
  useConditionalFields,
  useZodForm,
} from '../hooks/useZodForm';
import { getObjectShape } from '../utils/schema-parser';
import type { FieldConfig, FieldType, FormData, ZodFormConfig } from '../types';
import { cn } from '../utils/cn';
import {
  Button,
  Checkbox,
  FileUpload,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StarRating,
  Switch,
  Textarea,
} from './ui';
import { ArrayField, ObjectField } from './fields';

export interface ZodFormProps<T extends z.ZodTypeAny> extends ZodFormConfig {
  schema: T;
  className?: string;
  children?: React.ReactNode;
  onSubmit: (data: FormData<T>) => void | Promise<void>;
}

type FieldRenderProps = {
  name: string;
  config: FieldConfig;
  field: ControllerRenderProps<FieldValues, string>;
  disabled?: boolean;
};

const numericChange = (raw: string): number | undefined => {
  if (raw === '') return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
};

const dateToInputValue = (v: unknown): string => {
  if (v instanceof Date && !Number.isNaN(v.valueOf())) return v.toISOString().slice(0, 10);
  if (typeof v === 'string') return v;
  return '';
};

const renderForType = (type: FieldType, p: FieldRenderProps): React.ReactNode => {
  const { field, config, disabled } = p;
  const sharedInputProps = {
    name: field.name,
    onBlur: field.onBlur,
    disabled: disabled ?? config.disabled,
    placeholder: config.placeholder,
  };

  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'url':
    case 'tel':
      return (
        <Input
          {...sharedInputProps}
          type={type}
          value={(field.value as string | number | undefined) ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          minLength={config.minLength}
          maxLength={config.maxLength}
          pattern={config.pattern}
        />
      );
    case 'number':
      return (
        <Input
          {...sharedInputProps}
          type="number"
          value={(field.value as number | undefined) ?? ''}
          onChange={(e) => field.onChange(numericChange(e.target.value))}
          min={config.min}
          max={config.max}
          step={config.step}
        />
      );
    case 'range':
      return (
        <div className="space-y-1">
          <Input
            {...sharedInputProps}
            type="range"
            value={(field.value as number | undefined) ?? config.min ?? 0}
            onChange={(e) => field.onChange(numericChange(e.target.value))}
            min={config.min}
            max={config.max}
            step={config.step ?? 1}
          />
          <p className="text-center text-xs text-muted-foreground">
            {(field.value as number | undefined) ?? config.min ?? 0}
          </p>
        </div>
      );
    case 'textarea':
      return (
        <Textarea
          {...sharedInputProps}
          value={(field.value as string | undefined) ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          rows={config.rows ?? 4}
          minLength={config.minLength}
          maxLength={config.maxLength}
        />
      );
    case 'select': {
      const opts = config.options ?? [];
      return (
        <Select
          name={field.name}
          value={field.value ? String(field.value) : undefined}
          onValueChange={(v) => field.onChange(v)}
          disabled={disabled ?? config.disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={config.placeholder ?? 'Select…'} />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={String(o.value)} value={String(o.value)} disabled={o.disabled}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case 'radio': {
      const opts = config.options ?? [];
      return (
        <RadioGroup
          name={field.name}
          value={field.value ? String(field.value) : undefined}
          onValueChange={(v) => field.onChange(v)}
          disabled={disabled ?? config.disabled}
        >
          {opts.map((o) => (
            <div key={String(o.value)} className="flex items-center gap-2">
              <RadioGroupItem
                id={`${field.name}-${o.value}`}
                value={String(o.value)}
                disabled={o.disabled}
              />
              <Label htmlFor={`${field.name}-${o.value}`}>{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }
    case 'checkbox':
      return (
        <Checkbox
          name={field.name}
          checked={!!field.value}
          onCheckedChange={(v) => field.onChange(v === true)}
          disabled={disabled ?? config.disabled}
        />
      );
    case 'switch':
      return (
        <Switch
          name={field.name}
          checked={!!field.value}
          onCheckedChange={(v) => field.onChange(v)}
          disabled={disabled ?? config.disabled}
        />
      );
    case 'file':
      return (
        <FileUpload
          name={field.name}
          value={field.value as File | File[] | null | undefined}
          onChange={(files) => field.onChange(files)}
          accept={config.accept}
          multiple={config.multiple}
          maxSize={config.maxSize}
          maxFiles={config.maxFiles}
          disabled={disabled ?? config.disabled}
        />
      );
    case 'stars':
      return (
        <StarRating
          value={(field.value as number | undefined) ?? 0}
          onChange={(v) => field.onChange(v)}
          max={config.maxStars ?? 5}
          disabled={disabled ?? config.disabled}
        />
      );
    case 'date':
    case 'datetime-local':
    case 'time':
      return (
        <Input
          {...sharedInputProps}
          type={type}
          value={dateToInputValue(field.value)}
          onChange={(e) => {
            const v = e.target.value;
            field.onChange(type === 'date' && v ? new Date(v) : v);
          }}
        />
      );
    default:
      return (
        <Input
          {...sharedInputProps}
          type="text"
          value={(field.value as string | undefined) ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
        />
      );
  }
};

/**
 * Schema-driven form renderer. Pass a Zod schema and an onSubmit handler;
 * field types are inferred from the schema. Override per-field rendering via
 * `fieldOptions` (e.g. `{ rating: { type: 'stars', maxStars: 10 } }`).
 */
export function ZodForm<T extends z.ZodTypeAny>({
  schema,
  className,
  children,
  onSubmit,
  onError,
  onChange,
  theme = 'light',
  layout = 'vertical',
  fieldOptions = {},
  submitButtonText = 'Submit',
  resetButtonText = 'Reset',
  showSubmitButton = true,
  showResetButton = false,
  loading = false,
  disabled = false,
  defaultValues,
  mode = 'onChange',
}: ZodFormProps<T>) {
  const form = useZodForm({
    schema,
    onSubmit,
    onError: onError as ((errors: unknown) => void) | undefined,
    defaultValues,
    mode,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
    fields,
    resetForm,
  } = form;

  const formValues = watch() as Record<string, unknown>;
  const visibleFields = useConditionalFields(fields, formValues);

  React.useEffect(() => {
    if (onChange) onChange(formValues);
  }, [formValues, onChange]);

  const formClasses = cn(
    'space-y-6',
    layout === 'horizontal' && 'grid grid-cols-2 gap-6 space-y-0',
    layout === 'grid' && 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 space-y-0',
    className,
  );

  const renderArray = (name: string, config: FieldConfig) => (
    <ArrayFieldAdapter
      name={name}
      config={config}
      form={form as unknown as UseFormReturn<FormValues>}
      disabled={disabled || loading}
    />
  );

  const renderObject = (name: string, config: FieldConfig) => {
    const objShape = getObjectShape(schema)[name];
    const nested = objShape ? getObjectShape(objShape) : {};
    return (
      <ObjectField name={name} label={config.label || name} description={config.description}>
        {Object.entries(nested).map(([nestedKey]) => (
          <FormItem key={nestedKey}>
            <FormLabel>{nestedKey}</FormLabel>
            <FormControl>
              <Controller
                name={`${name}.${nestedKey}`}
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={(field.value as string | undefined) ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={disabled || loading}
                  />
                )}
              />
            </FormControl>
          </FormItem>
        ))}
      </ObjectField>
    );
  };

  return (
    <FormProvider {...(form as unknown as UseFormReturn<FieldValues>)}>
      <div className={cn(theme === 'dark' && 'dark', 'text-foreground')}>
        <form
          className={formClasses}
          onSubmit={handleSubmit(
            async (data) => {
              try {
                await onSubmit(data as FormData<T>);
              } catch (err) {
                onError?.(err as never);
              }
            },
            (errors) => onError?.(errors as never),
          )}
        >
          {Object.entries(fields).map(([name, analysis]) => {
            if (!visibleFields[name]) return null;
            const userOpts = fieldOptions[name] ?? {};
            const config: FieldConfig = { ...analysis.config, ...userOpts };
            const resolvedType: FieldType =
              (userOpts.type as FieldType | undefined) ?? analysis.type;

            if (resolvedType === 'array') return <div key={name}>{renderArray(name, config)}</div>;
            if (resolvedType === 'object')
              return <div key={name}>{renderObject(name, config)}</div>;

            return (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      {config.label ?? name}
                      {analysis.required && <span className="ml-0.5 text-destructive">*</span>}
                    </FormLabel>
                    <FormControl>
                      {renderForType(resolvedType, {
                        name,
                        config,
                        field: field as ControllerRenderProps<FieldValues, string>,
                        disabled: disabled || loading,
                      })}
                    </FormControl>
                    {config.description && <FormDescription>{config.description}</FormDescription>}
                    {fieldState.error?.message && (
                      <p role="alert" className="text-sm font-medium text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            );
          })}

          {children}

          {(showSubmitButton || showResetButton) && (
            <div className="flex items-center justify-end gap-3 pt-2">
              {showResetButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting || loading}
                >
                  {resetButtonText}
                </Button>
              )}
              {showSubmitButton && (
                <Button type="submit" disabled={disabled || isSubmitting || loading}>
                  {submitButtonText}
                </Button>
              )}
            </div>
          )}
        </form>
        {/* Defensive aria-hidden region for screen reader summary of form errors. */}
        <ErrorSummary errors={form.formState.errors as FieldErrors<Record<string, unknown>>} />
      </div>
    </FormProvider>
  );
}

interface ArrayFieldAdapterProps {
  name: string;
  config: FieldConfig;
  form: UseFormReturn<FormValues>;
  disabled?: boolean;
}

function ArrayFieldAdapter({ name, config, form, disabled }: ArrayFieldAdapterProps) {
  const array = useArrayField(name, form);
  return (
    <ArrayField
      name={name}
      label={config.label ?? name}
      description={config.description}
      items={array.items}
      onAdd={() => array.append({})}
      onRemove={array.remove}
      onMove={array.move}
      renderItem={(_item, index) => (
        <Input
          name={`${name}.${index}`}
          placeholder={config.placeholder ?? `Item ${index + 1}`}
          disabled={disabled}
        />
      )}
      addButtonText={config.addButtonText}
      removeButtonText={config.removeButtonText}
      minItems={config.minItems}
      maxItems={config.maxItems}
      disabled={disabled}
    />
  );
}

function ErrorSummary({ errors }: { errors: FieldErrors<Record<string, unknown>> }) {
  const count = Object.keys(errors).length;
  if (!count) return null;
  return (
    <p className="sr-only" aria-live="polite">
      {count} field error{count === 1 ? '' : 's'}
    </p>
  );
}

export default ZodForm;
