import { z } from 'zod';
import { mapZodTypeToFieldType, parseSchema, generateDefaultValues } from './schema-parser';

describe('Schema Parser', () => {
  describe('mapZodTypeToFieldType', () => {
    it('should map string to text field', () => {
      const schema = z.string();
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('text');
    });

    it('should map email string to email field', () => {
      const schema = z.string().email();
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('email');
    });

    it('should map number to number field', () => {
      const schema = z.number();
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('number');
    });

    it('should map boolean to checkbox field', () => {
      const schema = z.boolean();
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('checkbox');
    });

    it('should map enum to radio field for small option sets', () => {
      const schema = z.enum(['option1', 'option2']);
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('radio');
      expect(result.config.options).toHaveLength(2);
    });

    it('should map enum to select field for large option sets', () => {
      const schema = z.enum(['option1', 'option2', 'option3', 'option4', 'option5']);
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('select');
      expect(result.config.options).toHaveLength(5);
    });

    it('should map long string to textarea', () => {
      const schema = z.string().min(100);
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('textarea');
    });

    it('should map small range to range slider', () => {
      const schema = z.number().min(1).max(5);
      const result = mapZodTypeToFieldType(schema);
      expect(result.type).toBe('range');
      expect(result.config.min).toBe(1);
      expect(result.config.max).toBe(5);
    });
  });

  describe('parseSchema', () => {
    it('should parse simple object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const result = parseSchema(schema);

      expect(Object.keys(result)).toEqual(['name', 'age', 'email']);
      expect(result.name.type).toBe('text');
      expect(result.age.type).toBe('number');
      expect(result.email.type).toBe('email');
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        phone: z.string().optional(),
      });

      const result = parseSchema(schema);

      expect(result.name.required).toBe(true);
      expect(result.phone.required).toBe(false);
    });
  });

  describe('generateDefaultValues', () => {
    it('should generate default values for object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
        tags: z.array(z.string()),
      });

      const result = generateDefaultValues(schema);

      expect(result).toEqual({
        name: '',
        age: 0,
        active: false,
        tags: [],
      });
    });

    it('should use Zod defaults when available', () => {
      const schema = z.object({
        name: z.string().default('John'),
        count: z.number().default(5),
      });

      const result = generateDefaultValues(schema);

      expect(result).toEqual({
        name: 'John',
        count: 5,
      });
    });
  });
});
