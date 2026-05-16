// Main entry point — storage-free renderer. No Firebase imports below this line.
//
// CSS is NOT imported here. Consumers who want our default styling do:
//   import '@oftomorrow/zod-form/styles.css';

export { ZodForm, type ZodFormProps } from './components/ZodForm';
export { default } from './components/ZodForm';

export { useArrayField, useConditionalFields, useZodForm } from './hooks/useZodForm';

export * from './components/ui';
export * from './components/fields';

export * from './types';

export {
  analyzeField,
  analyzeSchema,
  extractValidationRules,
  generateDefaultValues,
  getObjectShape,
  getZodTypeInfo,
  mapZodTypeToFieldType,
  parseSchema,
  validateWithSchema,
} from './utils/schema-parser';

export { cn } from './utils/cn';
