import React, { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { ZodFormConfig, FormData, FieldType, Theme } from '../types';
import { useZodForm, useConditionalFields, useArrayField } from '../hooks/useZodForm';
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

import { ArrayField, ObjectField } from './fields';

interface ZodFormProps<T extends z.ZodTypeAny> extends ZodFormConfig {
  schema: T;
  className?: string;
  children?: React.ReactNode;
  onSubmit: (data: FormData<T>) => void | Promise<void>;
}

export function ZodForm<T extends z.ZodTypeAny>({
  schema,
  className,
  children,
  onSubmit,
  onError,
  onChange,
  theme = 'dark',
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
  ...config
}: ZodFormProps<T>) {
  // Initialize form
  const form = useZodForm({
    schema,
    onSubmit,
    onError,
    defaultValues,
    mode,
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
    fields,
    schemaAnalysis,
    submitForm,
    resetForm,
  } = form;

  // Watch all form values for conditional logic
  const formValues = watch();

  // Determine visible fields based on conditional logic
  const visibleFields = useConditionalFields(fields, formValues);

  // Handle form change events
  React.useEffect(() => {
    if (onChange) {
      onChange(formValues);
    }
  }, [formValues, onChange]);

  // Theme classes
  const themeConfig = getThemeClasses(theme);

  const formClasses = cn(
    'zf-form',
    themeClasses.form,
    themeConfig.root,
    layout === 'horizontal' && 'space-y-0 grid grid-cols-2 gap-6',
    layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    className
  );

  // Render individual field
  const renderField = (name: string, fieldAnalysis: (typeof fields)[string]) => {
    if (!visibleFields[name]) return null;

    const fieldConfig = { ...fieldAnalysis.config, ...fieldOptions[name] };
    const fieldError = errors[name];
    const isFieldDisabled = disabled || fieldConfig.disabled || loading;
    const isFieldReadOnly = fieldConfig.readOnly;

    const fieldProps = {
      name,
      label: fieldConfig.label || name,
      placeholder: fieldConfig.placeholder,
      description: fieldConfig.description,
      error: fieldError,
      disabled: isFieldDisabled,
      readOnly: isFieldReadOnly,
      required: fieldConfig.required,
      className: fieldConfig.className,
    };

    const containerClasses = cn(themeClasses.fieldContainer, fieldConfig.containerClassName);

    return (
      <div key={name} className={containerClasses}>
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState }) => {
            const componentProps = {
              ...fieldProps,
              ...field,
              error: fieldState.error,
            };

            return (
              <>
                {renderFieldComponent(fieldAnalysis.type, componentProps, fieldConfig)}
                {fieldProps.description && <Description>{fieldProps.description}</Description>}
                <ErrorMessage error={fieldState.error} />
              </>
            );
          }}
        />
      </div>
    );
  };

  // Render field component based on type
  const renderFieldComponent = (type: FieldType, props: any, config: any) => {
    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'url':
      case 'tel':
        return <Input {...props} type={type} />;

      case 'number':
        return (
          <Input {...props} type="number" min={config.min} max={config.max} step={config.step} />
        );

      case 'range':
        return (
          <div className="space-y-2">
            <Input {...props} type="range" min={config.min} max={config.max} step={config.step} />
            <div className="text-xs text-zf-text-muted text-center">
              {props.value || config.min || 0}
            </div>
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            {...props}
            rows={config.rows || 3}
            autoResize={config.autoResize}
            documentUpload={config.documentUpload}
          />
        );

      case 'select':
        return (
          <Select
            {...props}
            options={config.options || []}
            searchable={config.searchable}
            emptyOption={config.emptyOption}
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <RadioGroup
              {...props}
              options={config.options || []}
              orientation={config.orientation}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox {...props} />
            {props.label && <Label htmlFor={props.name}>{props.label}</Label>}
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center justify-between">
            {props.label && <Label>{props.label}</Label>}
            <Switch {...props} />
          </div>
        );

      case 'file':
        return (
          <FileUpload
            {...props}
            accept={config.accept}
            multiple={config.multiple}
            imagePreview={config.imagePreview}
            documentUpload={config.documentUpload}
            maxSize={config.maxSize}
            maxFiles={config.maxFiles}
          />
        );

      case 'stars':
        return (
          <div className="space-y-2">
            {props.label && <Label>{props.label}</Label>}
            <StarRating
              {...props}
              maxStars={config.maxStars || 5}
              allowHalf={config.allowHalf}
              showValue={config.showValue}
            />
          </div>
        );

      case 'date':
      case 'datetime-local':
      case 'time':
        return <Input {...props} type={type} />;

      case 'array':
        return renderArrayField(props.name, config);

      case 'object':
        return renderObjectField(props.name, config);

      default:
        return <Input {...props} type="text" />;
    }
  };

  // Render array field
  const renderArrayField = (name: string, config: any) => {
    const arrayField = useArrayField(name, form);
    const fieldError = errors[name];

    return (
      <ArrayField
        name={name}
        label={config.label || name}
        description={config.description}
        error={fieldError}
        items={arrayField.items}
        onAdd={() => arrayField.append({})}
        onRemove={arrayField.remove}
        onMove={arrayField.move}
        renderItem={(item, index) => (
          <div key={`${name}.${index}`}>
            {/* Render nested fields based on array item schema */}
            <Input name={`${name}.${index}`} placeholder={`Item ${index + 1}`} className="w-full" />
          </div>
        )}
        addButtonText={config.addButtonText}
        removeButtonText={config.removeButtonText}
        minItems={config.minItems}
        maxItems={config.maxItems}
        sortable={config.sortable}
        disabled={disabled || loading}
      />
    );
  };

  // Render object field
  const renderObjectField = (name: string, config: any) => {
    const fieldError = errors[name];

    return (
      <ObjectField
        name={name}
        label={config.label || name}
        description={config.description}
        error={fieldError}
        collapsible={config.collapsible}
        defaultExpanded={config.defaultExpanded}
        showBorder={config.showBorder}
      >
        {/* Render nested object fields */}
        <div className="space-y-4">
          {Object.entries(config.fields || {}).map(([fieldName, fieldConfig]) => (
            <div key={fieldName} className="space-y-2">
              <Label>{fieldConfig.label || fieldName}</Label>
              <Input
                name={`${name}.${fieldName}`}
                placeholder={fieldConfig.placeholder}
                disabled={disabled || loading}
              />
            </div>
          ))}
        </div>
      </ObjectField>
    );
  };

  return (
    <div className={themeConfig.root}>
      <form className={formClasses} onSubmit={handleSubmit(submitForm)}>
        {/* Render all fields */}
        {Object.entries(fields).map(([name, fieldAnalysis]) => renderField(name, fieldAnalysis))}

        {/* Custom children */}
        {children}

        {/* Form actions */}
        {(showSubmitButton || showResetButton) && (
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-zf-border">
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
              <Button type="submit" loading={isSubmitting || loading} disabled={disabled}>
                {submitButtonText}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// Export default
export default ZodForm;
