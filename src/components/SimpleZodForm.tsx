import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn, themeClasses, getThemeClasses } from '../utils/cn';

// Import all UI components
import {
  Label,
  ErrorMessage,
  Description,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Button,
  Switch,
  StarRating,
  FileUpload,
} from './ui';

interface SimpleZodFormProps {
  schema: z.ZodTypeAny;
  onSubmit: (data: any) => void | Promise<void>;
  onError?: (errors: any) => void;
  defaultValues?: any;
  theme?: 'dark' | 'light' | 'auto';
  submitButtonText?: string;
  resetButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  className?: string;
  fieldOptions?: Record<string, any>;
}

export function SimpleZodForm({
  schema,
  onSubmit,
  onError,
  defaultValues = {},
  theme = 'dark',
  submitButtonText = 'Submit',
  resetButtonText = 'Reset',
  showSubmitButton = true,
  showResetButton = false,
  className,
  fieldOptions = {},
}: SimpleZodFormProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // Get schema shape for field generation
  const getSchemaShape = (schema: z.ZodTypeAny): Record<string, any> => {
    if (schema instanceof z.ZodObject) {
      return schema._def.shape();
    }
    return {};
  };

  const schemaShape = getSchemaShape(schema);

  // Determine field type from Zod type
  const getFieldType = (zodType: z.ZodTypeAny, fieldName?: string): string => {
    if (zodType instanceof z.ZodString) {
      // Check for email validation
      if (zodType._def.checks?.some((check: any) => check.kind === 'email')) {
        return 'email';
      }
      // Check for URL validation
      if (zodType._def.checks?.some((check: any) => check.kind === 'url')) {
        return 'url';
      }
      // Check for min length (use enhanced textarea for long text)
      const minCheck = zodType._def.checks?.find((check: any) => check.kind === 'min') as any;
      if (minCheck && minCheck.value >= 100) {
        return 'enhanced-textarea';
      }
      // Enhanced textarea for bio, notes, description, document fields
      if (
        fieldName &&
        ['bio', 'notes', 'description', 'document', 'documentText'].includes(
          fieldName.toLowerCase()
        )
      ) {
        return 'enhanced-textarea';
      }
      return 'text';
    }

    if (zodType instanceof z.ZodNumber) {
      const minCheck = zodType._def.checks?.find((check: any) => check.kind === 'min') as any;
      const maxCheck = zodType._def.checks?.find((check: any) => check.kind === 'max') as any;

      // Auto-detect star rating (1-5 or 1-10 range)
      if (minCheck && maxCheck) {
        if (
          (minCheck.value === 1 && maxCheck.value === 5) ||
          (fieldName &&
            ['rating', 'satisfaction', 'stars'].some(term =>
              fieldName.toLowerCase().includes(term)
            ))
        ) {
          return 'stars';
        }
        // Use range for small numeric ranges
        if (maxCheck.value - minCheck.value <= 10) {
          return 'range';
        }
      }
      return 'number';
    }

    if (zodType instanceof z.ZodBoolean) {
      return 'checkbox';
    }

    if (zodType instanceof z.ZodDate) {
      return 'date';
    }

    if (zodType instanceof z.ZodEnum) {
      return 'select';
    }

    if (zodType instanceof z.ZodArray) {
      return 'array';
    }

    if (zodType instanceof z.ZodObject) {
      return 'object';
    }

    // Handle optional and nullable types
    if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
      return getFieldType(zodType.unwrap());
    }

    // Handle default types
    if (zodType instanceof z.ZodDefault) {
      return getFieldType(zodType._def.innerType);
    }

    return 'text';
  };

  // Get field options from Zod type
  const getFieldOptions = (zodType: z.ZodTypeAny) => {
    const options: any = {};

    if (zodType instanceof z.ZodEnum) {
      options.options = zodType._def.values.map((value: any) => ({
        label: String(value).charAt(0).toUpperCase() + String(value).slice(1),
        value: value,
      }));
    }

    if (zodType instanceof z.ZodNumber) {
      zodType._def.checks?.forEach((check: any) => {
        if (check.kind === 'min') options.min = check.value;
        if (check.kind === 'max') options.max = check.value;
        if (check.kind === 'multipleOf') options.step = check.value;
      });
    }

    if (zodType instanceof z.ZodString) {
      zodType._def.checks?.forEach((check: any) => {
        if (check.kind === 'min') options.minLength = check.value;
        if (check.kind === 'max') options.maxLength = check.value;
      });
    }

    return options;
  };

  // Check if field is required
  const isRequired = (zodType: z.ZodTypeAny): boolean => {
    return !(zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable);
  };

  // Render field component
  const renderField = (name: string, zodType: z.ZodTypeAny) => {
    const fieldType = getFieldType(zodType);
    const fieldOpts = getFieldOptions(zodType);
    const userOptions = fieldOptions[name] || {};
    const required = isRequired(zodType);
    const error = errors[name] as any;

    const label = userOptions.label || name.charAt(0).toUpperCase() + name.slice(1);
    const placeholder = userOptions.placeholder || `Enter ${label.toLowerCase()}`;

    return (
      <div key={name} className="space-y-2">
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            switch (fieldType) {
              case 'email':
              case 'url':
              case 'text':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <Input
                      {...field}
                      type={fieldType}
                      placeholder={placeholder}
                      error={error}
                      disabled={isSubmitting}
                      {...fieldOpts}
                      {...userOptions}
                    />
                  </>
                );

              case 'number':
              case 'range':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <Input
                      {...field}
                      type={fieldType}
                      placeholder={placeholder}
                      error={error}
                      disabled={isSubmitting}
                      onChange={e => field.onChange(Number(e.target.value))}
                      {...fieldOpts}
                      {...userOptions}
                    />
                    {fieldType === 'range' && (
                      <div className="text-xs text-center text-zf-text-muted">
                        {field.value || fieldOpts.min || 0}
                      </div>
                    )}
                  </>
                );

              case 'textarea':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <Textarea
                      {...field}
                      placeholder={placeholder}
                      error={error}
                      disabled={isSubmitting}
                      rows={4}
                      {...fieldOpts}
                      {...userOptions}
                    />
                  </>
                );

              case 'select':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <Select
                      {...field}
                      options={fieldOpts.options || []}
                      error={error}
                      disabled={isSubmitting}
                      emptyOption={required ? undefined : 'Select an option...'}
                      {...userOptions}
                    />
                  </>
                );

              case 'checkbox':
                return (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      {...field}
                      checked={field.value || false}
                      error={error}
                      disabled={isSubmitting}
                      {...userOptions}
                    />
                    <Label htmlFor={name}>{label}</Label>
                  </div>
                );

              case 'stars':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <StarRating
                      value={field.value || 0}
                      onChange={field.onChange}
                      max={fieldOpts.max || 5}
                      size="lg"
                      disabled={isSubmitting}
                      {...userOptions}
                    />
                  </>
                );

              case 'enhanced-textarea':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <div className="relative">
                      <Textarea
                        {...field}
                        placeholder={placeholder}
                        error={error}
                        disabled={isSubmitting}
                        rows={6}
                        className="pr-10"
                        {...fieldOpts}
                        {...userOptions}
                      />
                      <label className="absolute top-3 right-3 cursor-pointer text-zf-accent hover:text-zf-accent/80">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <input
                          type="file"
                          accept=".txt,.md,.doc,.docx"
                          onChange={event => {
                            const file = event.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = e => {
                              const text = e.target?.result as string;
                              field.onChange(text);
                            };
                            reader.readAsText(file);
                          }}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                  </>
                );

              case 'date':
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <Input
                      {...field}
                      type="date"
                      error={error}
                      disabled={isSubmitting}
                      {...userOptions}
                    />
                  </>
                );

              default:
                return (
                  <>
                    <Label required={required}>{label}</Label>
                    <Input
                      {...field}
                      type="text"
                      placeholder={placeholder}
                      error={error}
                      disabled={isSubmitting}
                      {...userOptions}
                    />
                  </>
                );
            }
          }}
        />

        {userOptions.description && <Description>{userOptions.description}</Description>}

        <ErrorMessage error={error} />
      </div>
    );
  };

  const themeConfig = getThemeClasses(theme);

  const formClasses = cn('zf-form', themeClasses.form, themeConfig.root, className);

  return (
    <div className={themeConfig.root}>
      <form className={formClasses} onSubmit={handleSubmit(onSubmit, onError)}>
        {Object.entries(schemaShape).map(([name, zodType]) =>
          renderField(name, zodType as z.ZodTypeAny)
        )}

        {/* Form actions */}
        {(showSubmitButton || showResetButton) && (
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-zf-border">
            {showResetButton && (
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                {resetButtonText}
              </Button>
            )}

            {showSubmitButton && (
              <Button type="submit" loading={isSubmitting}>
                {submitButtonText}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default SimpleZodForm;
