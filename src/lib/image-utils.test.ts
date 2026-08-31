import { describe, it, expect } from 'vitest';
import { getImageExtension } from './image-utils';

describe('getImageExtension', () => {
  it("devuelve 'jpg' para image/jpeg", () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(getImageExtension(file)).toBe('jpg');
  });

  it("devuelve 'png' para image/png", () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    expect(getImageExtension(file)).toBe('png');
  });

  it("devuelve 'webp' para image/webp", () => {
    const file = new File([''], 'test.webp', { type: 'image/webp' });
    expect(getImageExtension(file)).toBe('webp');
  });

  it("devuelve 'jpg' por defecto para tipos desconocidos", () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' });
    expect(getImageExtension(file)).toBe('jpg');
  });
});
