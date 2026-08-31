import { describe, it, expect } from 'vitest';
import { formatDateForCSV, formatDateTimeForCSV } from './export-csv';

describe('formatDateForCSV', () => {
  it('formatea una fecha válida al formato DD/MM/YYYY', () => {
    expect(formatDateForCSV('2026-03-15')).toBe('15/03/2026');
  });

  it('formatea un objeto Date', () => {
    expect(formatDateForCSV(new Date('2026-01-01T00:00:00Z'))).toBe('01/01/2026');
  });

  it('devuelve string vacío para fecha vacía', () => {
    expect(formatDateForCSV('')).toBe('');
  });

  it('devuelve string vacío para fecha inválida', () => {
    expect(formatDateForCSV('not-a-date')).toBe('');
  });

  it('maneja fechas con zona horaria', () => {
    const result = formatDateForCSV('2026-12-25T12:00:00Z');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe('formatDateTimeForCSV', () => {
  it('formatea fecha y hora', () => {
    const result = formatDateTimeForCSV('2026-06-15T18:30:00Z');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it('devuelve string vacío para input vacío', () => {
    expect(formatDateTimeForCSV('')).toBe('');
  });

  it('devuelve string vacío para input inválido', () => {
    expect(formatDateTimeForCSV('invalid')).toBe('');
  });
});
