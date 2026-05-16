import { z } from 'zod';
import type { FieldAnalysis, FieldConfig, FieldType, SchemaAnalysis, ZodTypeInfo } from '../types';

// Zod 4 stores schema metadata at `_zod.def`. Checks (min/max/regex/format/etc)
// are objects with `_zod.def.check` discriminator. `instanceof` still works for
// the public ZodString/ZodNumber/etc — that's what we rely on for type
// discrimination, and read `_zod.def.checks` for the per-type detail.

interface ZodCheckDef {
  check: string;
  format?: string;
  value?: number;
  inclusive?: boolean;
  minimum?: number;
  maximum?: number;
  pattern?: RegExp;
}

const checkDef = (c: unknown): ZodCheckDef | undefined => {
  return (c as { _zod?: { def?: ZodCheckDef } })?._zod?.def;
};

const getChecks = (schema: z.ZodTypeAny): ZodCheckDef[] => {
  const def = (schema as unknown as { _zod?: { def?: { checks?: unknown[] } } })._zod?.def;
  const checks = def?.checks ?? [];
  return checks.map(checkDef).filter((c): c is ZodCheckDef => !!c);
};

/**
 * Unwrap wrappers (Optional, Nullable, Default, Pipe) to get the underlying
 * field schema. Returns the type a renderer should switch on, plus collected
 * metadata (required flag, default value).
 */
const unwrapToBase = (
  schema: z.ZodTypeAny,
): { base: z.ZodTypeAny; required: boolean; defaultValue?: unknown } => {
  let current: z.ZodTypeAny = schema;
  let required = true;
  let defaultValue: unknown;

  // unbounded protection — schemas shouldn't nest wrappers thousands deep
  for (let i = 0; i < 32; i++) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      required = false;
      current = (current as z.ZodOptional<z.ZodTypeAny>).unwrap() as z.ZodTypeAny;
      continue;
    }
    if (current instanceof z.ZodDefault) {
      const def = (
        current as unknown as { _zod: { def: { defaultValue: unknown; innerType: z.ZodTypeAny } } }
      )._zod.def;
      defaultValue =
        typeof def.defaultValue === 'function'
          ? (def.defaultValue as () => unknown)()
          : def.defaultValue;
      current = def.innerType;
      continue;
    }
    // ZodPipe replaces ZodEffects for refines/transforms. The "in" side is what
    // the user-facing form binds to.
    if (current instanceof z.ZodPipe) {
      const inner = (current as unknown as { _zod: { def: { in: z.ZodTypeAny } } })._zod.def.in;
      if (inner === current) break;
      current = inner;
      continue;
    }
    break;
  }

  return { base: current, required, defaultValue };
};

/**
 * Map a Zod schema to a renderer-friendly field type with inferred config.
 * Inference rules:
 *   - z.string().email/url/uuid → 'email'/'url' (uuid stays 'text' with pattern)
 *   - z.string().min(>=100) → 'textarea'
 *   - z.number() with bounded range ≤10 → 'range' slider
 *   - z.enum with ≤4 options → 'radio', otherwise 'select'
 *   - z.boolean → 'checkbox' (consumers can override to 'switch' via fieldOptions)
 */
export const mapZodTypeToFieldType = (
  zodType: z.ZodTypeAny,
): { type: FieldType; config: Partial<FieldConfig> } => {
  const { base, required, defaultValue } = unwrapToBase(zodType);
  const config: Partial<FieldConfig> = {};
  if (!required) config.required = false;
  if (defaultValue !== undefined) config.defaultValue = defaultValue;

  if (base instanceof z.ZodString) {
    const checks = getChecks(base);
    for (const c of checks) {
      if (c.check === 'string_format') {
        if (c.format === 'email') return { type: 'email', config };
        if (c.format === 'url') return { type: 'url', config };
        if (c.format === 'uuid' || c.format === 'guid') {
          config.pattern = '^[0-9a-fA-F-]{32,36}$';
        }
        if (c.format === 'regex' && c.pattern instanceof RegExp) {
          config.pattern = c.pattern.source;
        }
      } else if (c.check === 'min_length' && typeof c.minimum === 'number') {
        config.minLength = c.minimum;
        if (c.minimum >= 100) return { type: 'textarea', config };
      } else if (c.check === 'max_length' && typeof c.maximum === 'number') {
        config.maxLength = c.maximum;
      }
    }
    return { type: 'text', config };
  }

  if (base instanceof z.ZodNumber) {
    let min: number | undefined;
    let max: number | undefined;
    for (const c of getChecks(base)) {
      if (c.check === 'greater_than' && typeof c.value === 'number') {
        config.min = c.value;
        min = c.value;
      } else if (c.check === 'less_than' && typeof c.value === 'number') {
        config.max = c.value;
        max = c.value;
      } else if (c.check === 'number_format' && c.format === 'safeint') {
        config.step = 1;
      } else if (c.check === 'multiple_of' && typeof c.value === 'number') {
        config.step = c.value;
      }
    }
    if (min !== undefined && max !== undefined && max - min <= 10) {
      return { type: 'range', config };
    }
    return { type: 'number', config };
  }

  if (base instanceof z.ZodBigInt) return { type: 'number', config };
  if (base instanceof z.ZodBoolean) return { type: 'checkbox', config };
  if (base instanceof z.ZodDate) return { type: 'date', config };

  if (base instanceof z.ZodEnum) {
    const values = (base as z.ZodEnum<Record<string, string>>).options;
    const options = values.map((value) => ({
      label: String(value).charAt(0).toUpperCase() + String(value).slice(1),
      value,
    }));
    config.options = options;
    return { type: options.length <= 4 ? 'radio' : 'select', config };
  }

  if (base instanceof z.ZodArray) {
    for (const c of getChecks(base)) {
      if (c.check === 'min_length' && typeof c.minimum === 'number') config.minItems = c.minimum;
      if (c.check === 'max_length' && typeof c.maximum === 'number') config.maxItems = c.maximum;
    }
    return { type: 'array', config };
  }

  if (base instanceof z.ZodObject) return { type: 'object', config };
  if (base instanceof z.ZodRecord) return { type: 'record', config };

  if (base instanceof z.ZodDiscriminatedUnion) {
    const def = (
      base as unknown as { _zod: { def: { options: z.ZodTypeAny[]; discriminator: string } } }
    )._zod.def;
    const discriminator = def.discriminator;
    const options = def.options.map((opt, index) => {
      const shape = (opt as z.ZodObject<z.ZodRawShape>).shape;
      const discField = shape[discriminator];
      const literal = discField
        ? (discField as unknown as { _zod?: { def?: { values?: unknown[] } } })._zod?.def
            ?.values?.[0]
        : undefined;
      const value = literal !== undefined ? String(literal) : String(index);
      return {
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      };
    });
    config.options = options;
    return { type: 'select', config };
  }

  if (base instanceof z.ZodUnion) {
    const def = (base as unknown as { _zod: { def: { options: z.ZodTypeAny[] } } })._zod.def;
    const options = def.options.map((_opt, index) => ({
      label: `Option ${index + 1}`,
      value: index,
    }));
    config.options = options;
    return { type: 'radio', config };
  }

  return { type: 'text', config };
};

/**
 * Validation rules useful for both displaying field metadata and for synchronous
 * field-level checks. Mirrors the data {@link mapZodTypeToFieldType} pulls.
 */
export const extractValidationRules = (zodType: z.ZodTypeAny): Record<string, unknown> => {
  const { base, required } = unwrapToBase(zodType);
  const rules: Record<string, unknown> = { required };

  if (base instanceof z.ZodString) {
    for (const c of getChecks(base)) {
      if (c.check === 'min_length' && typeof c.minimum === 'number') rules.minLength = c.minimum;
      if (c.check === 'max_length' && typeof c.maximum === 'number') rules.maxLength = c.maximum;
      if (c.check === 'string_format') {
        if (c.format === 'email') rules.email = true;
        if (c.format === 'url') rules.url = true;
        if (c.format === 'uuid' || c.format === 'guid') rules.uuid = true;
        if (c.format === 'regex' && c.pattern instanceof RegExp) rules.pattern = c.pattern;
      }
    }
  }

  if (base instanceof z.ZodNumber) {
    for (const c of getChecks(base)) {
      if (c.check === 'greater_than' && typeof c.value === 'number') {
        rules.min = c.value;
        rules.minInclusive = c.inclusive ?? true;
      } else if (c.check === 'less_than' && typeof c.value === 'number') {
        rules.max = c.value;
        rules.maxInclusive = c.inclusive ?? true;
      } else if (c.check === 'number_format' && c.format === 'safeint') {
        rules.integer = true;
      } else if (c.check === 'multiple_of' && typeof c.value === 'number') {
        rules.multipleOf = c.value;
      }
    }
  }

  if (base instanceof z.ZodArray) {
    for (const c of getChecks(base)) {
      if (c.check === 'min_length' && typeof c.minimum === 'number') rules.minItems = c.minimum;
      if (c.check === 'max_length' && typeof c.maximum === 'number') rules.maxItems = c.maximum;
    }
  }

  return rules;
};

export const getZodTypeInfo = (zodType: z.ZodTypeAny): ZodTypeInfo => {
  const { base, defaultValue } = unwrapToBase(zodType);
  const def = (base as unknown as { _zod?: { def?: { type?: string; description?: string } } })._zod
    ?.def;
  const info: ZodTypeInfo = {
    typeName: (def?.type ?? 'unknown') as ZodTypeInfo['typeName'],
    isOptional: zodType instanceof z.ZodOptional,
    isNullable: zodType instanceof z.ZodNullable,
    hasDefault: zodType instanceof z.ZodDefault,
    constraints: {},
  };
  if (defaultValue !== undefined) info.defaultValue = defaultValue;
  if (base instanceof z.ZodEnum) {
    info.options = (base as z.ZodEnum<Record<string, string>>).options.map((value) => ({
      label: String(value),
      value,
    }));
  }
  if (def?.description) info.description = def.description;
  return info;
};

export const analyzeField = (name: string, zodType: z.ZodTypeAny): FieldAnalysis => {
  const { type, config } = mapZodTypeToFieldType(zodType);
  const validation = extractValidationRules(zodType);
  const typeInfo = getZodTypeInfo(zodType);
  return {
    name,
    type,
    zodType: typeInfo.typeName,
    required: validation.required !== false,
    config: { ...config, ...validation } as FieldConfig,
    defaultValue: typeInfo.defaultValue,
  };
};

/**
 * Return the shape of an object schema (Zod 4: `.shape` is a property, not a
 * function). For non-object schemas, returns an empty record.
 */
export const getObjectShape = (schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> => {
  if (schema instanceof z.ZodObject) {
    return (schema as z.ZodObject<z.ZodRawShape>).shape as Record<string, z.ZodTypeAny>;
  }
  return {};
};

export const parseSchema = (schema: z.ZodTypeAny): Record<string, FieldAnalysis> => {
  const shape = getObjectShape(schema);
  const fields: Record<string, FieldAnalysis> = {};
  for (const [key, zt] of Object.entries(shape)) {
    fields[key] = analyzeField(key, zt);
  }
  return fields;
};

export const analyzeSchema = (schema: z.ZodTypeAny): SchemaAnalysis => {
  const fields = Object.values(parseSchema(schema));
  const hasArrays = fields.some((f) => f.type === 'array');
  const hasObjects = fields.some((f) => f.type === 'object');
  const hasConditionals = fields.some((f) => f.config.showWhen);

  let complexity: SchemaAnalysis['complexity'] = 'simple';
  if (hasArrays || hasObjects || fields.length > 10) complexity = 'moderate';
  if (hasConditionals || fields.length > 20) complexity = 'complex';

  return { fields, hasArrays, hasObjects, hasConditionals, complexity };
};

/**
 * Generate sensible default values for a schema. Used to seed react-hook-form
 * when the consumer didn't pass `defaultValues`. ZodDefault values win;
 * primitives get empty/false/zero; arrays default to []; nested objects recurse.
 */
export const generateDefaultValues = (schema: z.ZodTypeAny): Record<string, unknown> => {
  const shape = getObjectShape(schema);
  const defaults: Record<string, unknown> = {};
  for (const [key, zt] of Object.entries(shape)) {
    const { base, defaultValue } = unwrapToBase(zt);
    if (defaultValue !== undefined) {
      defaults[key] = defaultValue;
    } else if (base instanceof z.ZodArray) {
      defaults[key] = [];
    } else if (base instanceof z.ZodObject) {
      defaults[key] = generateDefaultValues(base);
    } else if (base instanceof z.ZodBoolean) {
      defaults[key] = false;
    } else if (base instanceof z.ZodNumber || base instanceof z.ZodBigInt) {
      defaults[key] = 0;
    } else if (base instanceof z.ZodString) {
      defaults[key] = '';
    } else {
      defaults[key] = undefined;
    }
  }
  return defaults;
};

export const validateWithSchema = (schema: z.ZodTypeAny, data: unknown) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: [] as const };
  }
  return {
    success: false as const,
    data: undefined,
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      path: issue.path,
    })),
  };
};
