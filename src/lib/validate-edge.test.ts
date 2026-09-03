import { describe, it, expect } from 'vitest';
import { validateFormData, getFirstError } from './validate';
import { z } from 'zod';

describe('validateFormData edge cases', () => {
  const simpleSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    edad: z.coerce.number().min(0).max(150),
    activo: z.boolean().default(false),
  });

  function fd(data: Record<string, string | boolean>): FormData {
    const f = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'boolean') f.set(k, v ? 'on' : '');
      else f.set(k, v);
    }
    return f;
  }

  it('handles multiple values for same key (array)', () => {
    const f = new FormData();
    f.append('tags', 'a');
    f.append('tags', 'b');
    const schema = z.object({ tags: z.array(z.string()) });
    const result = validateFormData(schema, f);
    expect(result.success).toBe(true);
  });

  it('defaults boolean to false when missing', () => {
    const f = fd({ nombre: 'Test', edad: '25' });
    const result = validateFormData(simpleSchema, f);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activo).toBe(false);
    }
  });

  it('converts "on" string to boolean true', () => {
    const f = fd({ nombre: 'Test', edad: '25', activo: true });
    const result = validateFormData(simpleSchema, f);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activo).toBe(true);
    }
  });

  it('coerces string to number', () => {
    const f = fd({ nombre: 'Test', edad: '30' });
    const result = validateFormData(simpleSchema, f);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.edad).toBe(30);
    }
  });

  it('returns multiple errors for different fields', () => {
    const f = fd({ nombre: '', edad: '-5' });
    const result = validateFormData(simpleSchema, f);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('getFirstError edge cases', () => {
  it('returns first error of first key', () => {
    const errors = {
      b: ['second'],
      a: ['first'],
    };
    expect(getFirstError(errors)).toBe('second');
  });

  it('handles nested path', () => {
    const errors = {
      'user.email': ['Email invalido'],
    };
    expect(getFirstError(errors)).toBe('Email invalido');
  });
});
