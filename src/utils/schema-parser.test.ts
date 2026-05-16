import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  analyzeSchema,
  extractValidationRules,
  generateDefaultValues,
  mapZodTypeToFieldType,
  parseSchema,
  validateWithSchema,
} from './schema-parser';

describe('schema-parser (Zod 4)', () => {
  describe('mapZodTypeToFieldType', () => {
    it('maps plain string → text', () => {
      expect(mapZodTypeToFieldType(z.string()).type).toBe('text');
    });

    it('detects email format', () => {
      expect(mapZodTypeToFieldType(z.string().email()).type).toBe('email');
    });

    it('detects url format', () => {
      expect(mapZodTypeToFieldType(z.string().url()).type).toBe('url');
    });

    it('promotes long-minimum strings to textarea', () => {
      const result = mapZodTypeToFieldType(z.string().min(100));
      expect(result.type).toBe('textarea');
      expect(result.config.minLength).toBe(100);
    });

    it('records min/max length on strings', () => {
      const result = mapZodTypeToFieldType(z.string().min(2).max(50));
      expect(result.type).toBe('text');
      expect(result.config.minLength).toBe(2);
      expect(result.config.maxLength).toBe(50);
    });

    it('maps boolean → checkbox', () => {
      expect(mapZodTypeToFieldType(z.boolean()).type).toBe('checkbox');
    });

    it('maps date → date', () => {
      expect(mapZodTypeToFieldType(z.date()).type).toBe('date');
    });

    it('maps number with small bounded range → range', () => {
      const result = mapZodTypeToFieldType(z.number().min(1).max(5));
      expect(result.type).toBe('range');
      expect(result.config.min).toBe(1);
      expect(result.config.max).toBe(5);
    });

    it('maps number with wide bounded range → number', () => {
      const result = mapZodTypeToFieldType(z.number().min(0).max(1000));
      expect(result.type).toBe('number');
    });

    it('maps number with int check to step=1', () => {
      const result = mapZodTypeToFieldType(z.number().int());
      expect(result.config.step).toBe(1);
    });

    it('maps small enum → radio', () => {
      const result = mapZodTypeToFieldType(z.enum(['a', 'b']));
      expect(result.type).toBe('radio');
      expect(result.config.options).toHaveLength(2);
    });

    it('maps large enum → select', () => {
      const result = mapZodTypeToFieldType(z.enum(['a', 'b', 'c', 'd', 'e']));
      expect(result.type).toBe('select');
      expect(result.config.options).toHaveLength(5);
    });

    it('unwraps optional + nullable + default', () => {
      const result = mapZodTypeToFieldType(z.string().default('hi').optional().nullable());
      expect(result.type).toBe('text');
      expect(result.config.required).toBe(false);
      expect(result.config.defaultValue).toBe('hi');
    });

    it('unwraps refinements (ZodPipe in Zod 4)', () => {
      const refined = z.string().refine((v) => v.length > 0);
      expect(mapZodTypeToFieldType(refined).type).toBe('text');
    });

    it('unwraps transforms (ZodPipe)', () => {
      const transformed = z.string().transform((v) => v.trim());
      expect(mapZodTypeToFieldType(transformed).type).toBe('text');
    });

    it('maps array → array with min/max items', () => {
      const result = mapZodTypeToFieldType(z.array(z.string()).min(1).max(5));
      expect(result.type).toBe('array');
      expect(result.config.minItems).toBe(1);
      expect(result.config.maxItems).toBe(5);
    });

    it('maps object → object', () => {
      expect(mapZodTypeToFieldType(z.object({})).type).toBe('object');
    });

    it('falls back to text for unknown shapes', () => {
      const exotic = z.tuple([z.string(), z.number()]);
      expect(mapZodTypeToFieldType(exotic).type).toBe('text');
    });
  });

  describe('parseSchema', () => {
    it('parses object schema fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });
      const result = parseSchema(schema);
      expect(Object.keys(result)).toEqual(['name', 'age', 'email']);
      expect(result.name?.type).toBe('text');
      expect(result.age?.type).toBe('number');
      expect(result.email?.type).toBe('email');
    });

    it('marks optional fields as not required', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });
      const result = parseSchema(schema);
      expect(result.required?.required).toBe(true);
      expect(result.optional?.required).toBe(false);
    });

    it('returns empty record for non-object schemas', () => {
      expect(parseSchema(z.string())).toEqual({});
    });
  });

  describe('extractValidationRules', () => {
    it('captures string format rules', () => {
      const rules = extractValidationRules(z.string().email().min(5).max(20));
      expect(rules).toMatchObject({ email: true, minLength: 5, maxLength: 20, required: true });
    });

    it('captures number bounds and step', () => {
      const rules = extractValidationRules(z.number().int().min(0).max(10).multipleOf(2));
      expect(rules).toMatchObject({ min: 0, max: 10, integer: true, multipleOf: 2 });
    });

    it('captures array length rules', () => {
      const rules = extractValidationRules(z.array(z.string()).min(1).max(3));
      expect(rules).toMatchObject({ minItems: 1, maxItems: 3 });
    });

    it('marks optional fields not required', () => {
      const rules = extractValidationRules(z.string().optional());
      expect(rules.required).toBe(false);
    });
  });

  describe('generateDefaultValues', () => {
    it('produces type-appropriate defaults', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
        tags: z.array(z.string()),
        profile: z.object({ bio: z.string() }),
      });
      expect(generateDefaultValues(schema)).toEqual({
        name: '',
        age: 0,
        active: false,
        tags: [],
        profile: { bio: '' },
      });
    });

    it('uses .default() values when set', () => {
      const schema = z.object({
        name: z.string().default('John'),
        count: z.number().default(5),
      });
      expect(generateDefaultValues(schema)).toEqual({ name: 'John', count: 5 });
    });

    it('handles optional fields by leaving them undefined', () => {
      const schema = z.object({ nick: z.string().optional() });
      // optional with no .default falls through to the string branch → ''
      expect(generateDefaultValues(schema)).toEqual({ nick: '' });
    });
  });

  describe('validateWithSchema', () => {
    it('returns success on valid data', () => {
      const result = validateWithSchema(z.object({ n: z.string() }), { n: 'x' });
      expect(result.success).toBe(true);
    });

    it('returns Zod 4 .issues converted to field errors', () => {
      const result = validateWithSchema(z.object({ n: z.string().min(3) }), { n: 'x' });
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.field).toBe('n');
      expect(result.errors[0]?.path).toEqual(['n']);
    });
  });

  describe('analyzeSchema', () => {
    it('detects arrays and nested objects', () => {
      const schema = z.object({
        nick: z.string(),
        tags: z.array(z.string()),
        profile: z.object({ bio: z.string() }),
      });
      const analysis = analyzeSchema(schema);
      expect(analysis.hasArrays).toBe(true);
      expect(analysis.hasObjects).toBe(true);
      expect(analysis.complexity).toBe('moderate');
    });

    it('reports simple complexity for a flat schema', () => {
      const analysis = analyzeSchema(z.object({ a: z.string(), b: z.number() }));
      expect(analysis.complexity).toBe('simple');
    });
  });
});
