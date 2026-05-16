import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { z } from 'zod';
import { useArrayField, useConditionalFields, useZodForm } from './useZodForm';
import { parseSchema } from '../utils/schema-parser';

describe('useZodForm', () => {
  it('seeds defaults from the schema', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const { result } = renderHook(() => useZodForm({ schema, onSubmit: () => {} }));
    expect(result.current.getValues()).toEqual({ name: '', age: 0 });
  });

  it('uses supplied defaultValues over schema defaults', () => {
    const schema = z.object({ name: z.string() });
    const { result } = renderHook(() =>
      useZodForm({ schema, onSubmit: () => {}, defaultValues: { name: 'Bob' } }),
    );
    expect(result.current.getValues().name).toBe('Bob');
  });

  it('exposes parsed field analyses for the schema', () => {
    const schema = z.object({ email: z.string().email(), agree: z.boolean() });
    const { result } = renderHook(() => useZodForm({ schema, onSubmit: () => {} }));
    expect(result.current.fields.email?.type).toBe('email');
    expect(result.current.fields.agree?.type).toBe('checkbox');
  });

  it('validateField returns undefined for valid values and a message for invalid', async () => {
    const schema = z.object({ email: z.string().email('Bad email') });
    const { result } = renderHook(() => useZodForm({ schema, onSubmit: () => {} }));
    await expect(result.current.validateField('email', 'a@b.co')).resolves.toBeUndefined();
    await expect(result.current.validateField('email', 'nope')).resolves.toBe('Bad email');
    // Unknown field name returns undefined.
    await expect(result.current.validateField('does-not-exist', 'x')).resolves.toBeUndefined();
  });

  it('resetForm puts values back to the computed defaults', () => {
    const schema = z.object({ name: z.string() });
    const { result } = renderHook(() => useZodForm({ schema, onSubmit: () => {} }));
    act(() => result.current.setValue('name', 'changed'));
    expect(result.current.getValues().name).toBe('changed');
    act(() => result.current.resetForm());
    expect(result.current.getValues().name).toBe('');
  });

  it('getFieldConfig returns analysis for a known field, undefined otherwise', () => {
    const schema = z.object({ a: z.string() });
    const { result } = renderHook(() => useZodForm({ schema, onSubmit: () => {} }));
    expect(result.current.getFieldConfig('a')?.type).toBe('text');
    expect(result.current.getFieldConfig('missing')).toBeUndefined();
  });
});

describe('useConditionalFields', () => {
  const schema = z.object({
    a: z.string(),
    b: z.string(),
    c: z.string(),
  });

  const buildFields = (cond: Record<string, unknown>) => {
    const f = parseSchema(schema);
    if (f.b) f.b.config.showWhen = cond as never;
    return f;
  };

  it('shows fields without a condition by default', () => {
    const { result } = renderHook(() => useConditionalFields(parseSchema(schema), {}));
    expect(result.current).toEqual({ a: true, b: true, c: true });
  });

  it('applies equals operator', () => {
    const { result } = renderHook(() =>
      useConditionalFields(buildFields({ field: 'a', value: 'x', operator: 'equals' }), {
        a: 'x',
      }),
    );
    expect(result.current.b).toBe(true);
  });

  it('applies not-equals operator', () => {
    const { result } = renderHook(() =>
      useConditionalFields(buildFields({ field: 'a', value: 'x', operator: 'not-equals' }), {
        a: 'y',
      }),
    );
    expect(result.current.b).toBe(true);
  });

  it('applies contains operator on array', () => {
    const { result } = renderHook(() =>
      useConditionalFields(buildFields({ field: 'a', value: 'tag', operator: 'contains' }), {
        a: ['tag', 'other'],
      }),
    );
    expect(result.current.b).toBe(true);
  });

  it('applies greater-than and less-than operators', () => {
    const { result: gt } = renderHook(() =>
      useConditionalFields(buildFields({ field: 'a', value: 5, operator: 'greater-than' }), {
        a: 10,
      }),
    );
    expect(gt.current.b).toBe(true);

    const { result: lt } = renderHook(() =>
      useConditionalFields(buildFields({ field: 'a', value: 5, operator: 'less-than' }), {
        a: 2,
      }),
    );
    expect(lt.current.b).toBe(true);
  });
});

describe('useArrayField', () => {
  it('append/remove/move mutate the underlying field array', () => {
    const schema = z.object({ tags: z.array(z.string()) });
    const { result } = renderHook(() => {
      const form = useZodForm({ schema, onSubmit: () => {}, defaultValues: { tags: [] } });
      const array = useArrayField('tags', form);
      return { form, array };
    });
    act(() => result.current.array.append({ name: 'one' } as never));
    act(() => result.current.array.append({ name: 'two' } as never));
    expect((result.current.form.getValues().tags as unknown[]).length).toBe(2);
    act(() => result.current.array.move(0, 1));
    expect((result.current.form.getValues().tags as Array<{ name: string }>)[0]?.name).toBe('two');
    act(() => result.current.array.remove(0));
    expect((result.current.form.getValues().tags as unknown[]).length).toBe(1);
  });
});
