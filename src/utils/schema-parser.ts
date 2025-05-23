import { z } from 'zod';
import { FieldType, FieldConfig, FieldAnalysis, SchemaAnalysis, ZodTypeInfo } from '../types';

/**
 * Enhanced schema parser for converting Zod schemas to React form fields
 */

/**
 * Map Zod types to form field types with enhanced logic
 */
export const mapZodTypeToFieldType = (
  zodType: z.ZodTypeAny,
  path = ''
): { type: FieldType; config: Partial<FieldConfig> } => {
  // Handle ZodDefault wrapper
  if (zodType instanceof z.ZodDefault) {
    const result = mapZodTypeToFieldType(zodType._def.innerType, path);
    result.config.defaultValue = zodType._def.defaultValue();
    return result;
  }

  // Handle ZodOptional and ZodNullable wrappers
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
    const result = mapZodTypeToFieldType(zodType.unwrap(), path);
    result.config.required = false;
    return result;
  }

  // Handle ZodEffects (refinements and transforms)
  if (zodType instanceof z.ZodEffects) {
    return mapZodTypeToFieldType(zodType._def.schema, path);
  }

  // String types with enhanced detection
  if (zodType instanceof z.ZodString) {
    const config: Partial<FieldConfig> = {};

    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        switch (check.kind) {
          case 'email':
            return { type: 'email', config };
          case 'url':
            return { type: 'url', config };
          case 'uuid':
            config.pattern =
              '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
            break;
          case 'min':
            config.minLength = check.value;
            // Use textarea for long text (>= 100 chars)
            if (check.value >= 100) {
              return { type: 'textarea', config };
            }
            break;
          case 'max':
            config.maxLength = check.value;
            break;
          case 'regex':
            config.pattern = check.regex.source;
            break;
        }
      }
    }

    return { type: 'text', config };
  }

  // Number types with range detection
  if (zodType instanceof z.ZodNumber) {
    const config: Partial<FieldConfig> = {};
    let minValue: number | undefined;
    let maxValue: number | undefined;

    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        switch (check.kind) {
          case 'min':
            config.min = check.value;
            minValue = check.value;
            break;
          case 'max':
            config.max = check.value;
            maxValue = check.value;
            break;
          case 'int':
            config.step = 1;
            break;
          case 'multipleOf':
            config.step = check.value;
            break;
        }
      }
    }

    // Use range slider for small numeric ranges
    if (minValue !== undefined && maxValue !== undefined && maxValue - minValue <= 10) {
      return { type: 'range', config };
    }

    return { type: 'number', config };
  }

  // Boolean types
  if (zodType instanceof z.ZodBoolean) {
    return { type: 'checkbox', config: {} };
  }

  // Date types
  if (zodType instanceof z.ZodDate) {
    return { type: 'date', config: {} };
  }

  // Enum types
  if (zodType instanceof z.ZodEnum) {
    const options = zodType._def.values.map((value: any) => ({
      label: String(value).charAt(0).toUpperCase() + String(value).slice(1),
      value: value,
    }));

    // Use radio buttons for small option sets
    if (options.length <= 4) {
      return { type: 'radio', config: { options } };
    }

    return { type: 'select', config: { options } };
  }

  // Native enum types
  if (zodType instanceof z.ZodNativeEnum) {
    const enumValues = Object.values(zodType._def.values);
    const options = enumValues.map((value: any) => ({
      label: String(value).charAt(0).toUpperCase() + String(value).slice(1),
      value: value,
    }));

    return { type: 'select', config: { options } };
  }

  // Array types
  if (zodType instanceof z.ZodArray) {
    const config: Partial<FieldConfig> = {};

    if (zodType._def.minLength) {
      config.minItems = zodType._def.minLength.value;
    }
    if (zodType._def.maxLength) {
      config.maxItems = zodType._def.maxLength.value;
    }

    return { type: 'array', config };
  }

  // Object types
  if (zodType instanceof z.ZodObject) {
    return { type: 'object', config: {} };
  }

  // Record types (key-value pairs)
  if (zodType instanceof z.ZodRecord) {
    return { type: 'record', config: {} };
  }

  // Union types
  if (zodType instanceof z.ZodUnion) {
    const options = zodType._def.options.map((option: any, index: number) => ({
      label: `Option ${index + 1}`,
      value: index,
    }));

    return { type: 'radio', config: { options } };
  }

  // Discriminated union types
  if (zodType instanceof z.ZodDiscriminatedUnion) {
    const options = Array.from(zodType._def.optionsMap.keys()).map((key: any) => ({
      label: String(key).charAt(0).toUpperCase() + String(key).slice(1),
      value: key,
    }));

    return { type: 'select', config: { options } };
  }

  // File types (using ZodType with instanceof check)
  if ((zodType as any)._def?.typeName === 'ZodType' && (zodType as any)._def?.cls === File) {
    return { type: 'file', config: {} };
  }

  // BigInt types
  if (zodType instanceof z.ZodBigInt) {
    return { type: 'number', config: {} };
  }

  // Default fallback
  return { type: 'text', config: {} };
};

/**
 * Extract comprehensive validation rules from Zod schema
 */
export const extractValidationRules = (zodType: z.ZodTypeAny): Record<string, any> => {
  const rules: Record<string, any> = {};

  // Handle wrapper types
  if (zodType instanceof z.ZodDefault) {
    return extractValidationRules(zodType._def.innerType);
  }

  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
    const innerRules = extractValidationRules(zodType.unwrap());
    return { ...innerRules, required: false };
  }

  if (zodType instanceof z.ZodEffects) {
    return extractValidationRules(zodType._def.schema);
  }

  // String validation rules
  if (zodType instanceof z.ZodString) {
    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        switch (check.kind) {
          case 'min':
            rules.minLength = check.value;
            break;
          case 'max':
            rules.maxLength = check.value;
            break;
          case 'email':
            rules.email = true;
            break;
          case 'url':
            rules.url = true;
            break;
          case 'regex':
            rules.pattern = check.regex;
            break;
          case 'uuid':
            rules.uuid = true;
            break;
          case 'cuid':
            rules.cuid = true;
            break;
          case 'startsWith':
            rules.startsWith = check.value;
            break;
          case 'endsWith':
            rules.endsWith = check.value;
            break;
        }
      }
    }
  }

  // Number validation rules
  if (zodType instanceof z.ZodNumber) {
    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        switch (check.kind) {
          case 'min':
            rules.min = check.value;
            rules.minInclusive = check.inclusive;
            break;
          case 'max':
            rules.max = check.value;
            rules.maxInclusive = check.inclusive;
            break;
          case 'int':
            rules.integer = true;
            break;
          case 'multipleOf':
            rules.multipleOf = check.value;
            break;
          case 'finite':
            rules.finite = true;
            break;
        }
      }
    }
  }

  // Array validation rules
  if (zodType instanceof z.ZodArray) {
    if (zodType._def.minLength) {
      rules.minItems = zodType._def.minLength.value;
    }
    if (zodType._def.maxLength) {
      rules.maxItems = zodType._def.maxLength.value;
    }
  }

  // Set required flag (default is true unless optional/nullable)
  if (!(zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable)) {
    rules.required = true;
  }

  return rules;
};

/**
 * Get comprehensive type information from Zod schema
 */
export const getZodTypeInfo = (zodType: z.ZodTypeAny): ZodTypeInfo => {
  const info: ZodTypeInfo = {
    typeName: zodType._def.typeName,
    isOptional: zodType instanceof z.ZodOptional,
    isNullable: zodType instanceof z.ZodNullable,
    hasDefault: zodType instanceof z.ZodDefault,
    constraints: {},
  };

  if (zodType instanceof z.ZodDefault) {
    info.defaultValue = zodType._def.defaultValue();
  }

  if (zodType instanceof z.ZodEnum) {
    info.options = zodType._def.values.map((value: any) => ({
      label: String(value),
      value: value,
    }));
  }

  if (zodType._def.description) {
    info.description = zodType._def.description;
  }

  return info;
};

/**
 * Analyze a field within a schema
 */
export const analyzeField = (name: string, zodType: z.ZodTypeAny, path = ''): FieldAnalysis => {
  const fieldPath = path ? `${path}.${name}` : name;
  const { type, config } = mapZodTypeToFieldType(zodType, fieldPath);
  const validation = extractValidationRules(zodType);
  const typeInfo = getZodTypeInfo(zodType);

  return {
    name,
    type,
    zodType: zodType._def.typeName,
    required: validation.required !== false,
    config: {
      ...config,
      ...validation,
    },
    defaultValue: typeInfo.defaultValue,
  };
};

/**
 * Parse a complete Zod schema into field definitions
 */
export const parseSchema = (schema: z.ZodTypeAny, basePath = ''): Record<string, FieldAnalysis> => {
  const fields: Record<string, FieldAnalysis> = {};

  // Handle object schemas
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();

    Object.keys(shape).forEach(key => {
      const zodType = shape[key];
      fields[key] = analyzeField(key, zodType, basePath);
    });
  }

  return fields;
};

/**
 * Analyze a complete schema for complexity and features
 */
export const analyzeSchema = (schema: z.ZodTypeAny): SchemaAnalysis => {
  const fields = Object.values(parseSchema(schema));

  const hasArrays = fields.some(field => field.type === 'array');
  const hasObjects = fields.some(field => field.type === 'object');
  const hasConditionals = fields.some(field => field.config.showWhen);

  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';

  if (hasArrays || hasObjects || fields.length > 10) {
    complexity = 'moderate';
  }

  if (
    hasConditionals ||
    fields.length > 20 ||
    fields.some(
      field =>
        field.type === 'object' &&
        field.config.fields &&
        Object.keys(field.config.fields).length > 5
    )
  ) {
    complexity = 'complex';
  }

  return {
    fields,
    hasArrays,
    hasObjects,
    hasConditionals,
    complexity,
  };
};

/**
 * Generate default values from schema
 */
export const generateDefaultValues = (schema: z.ZodTypeAny): Record<string, any> => {
  const defaults: Record<string, any> = {};

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();

    Object.keys(shape).forEach(key => {
      const zodType = shape[key];

      if (zodType instanceof z.ZodDefault) {
        defaults[key] = zodType._def.defaultValue();
      } else if (zodType instanceof z.ZodArray) {
        defaults[key] = [];
      } else if (zodType instanceof z.ZodObject) {
        defaults[key] = generateDefaultValues(zodType);
      } else if (zodType instanceof z.ZodBoolean) {
        defaults[key] = false;
      } else if (zodType instanceof z.ZodNumber) {
        defaults[key] = 0;
      } else if (zodType instanceof z.ZodString) {
        defaults[key] = '';
      }
    });
  }

  return defaults;
};

/**
 * Validate if a value matches the expected Zod type
 */
export const validateWithSchema = (schema: z.ZodTypeAny, data: any) => {
  try {
    const result = schema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success
        ? []
        : result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            path: err.path,
          })),
    };
  } catch (error) {
    return {
      success: false,
      data: undefined,
      errors: [
        {
          field: 'root',
          message: 'Schema validation failed',
          code: 'custom',
          path: [],
        },
      ],
    };
  }
};
