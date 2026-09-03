import { describe, it, expect } from 'vitest';
import { formatDateForCSV, formatDateTimeForCSV } from './export-csv';

describe('formatDateForCSV', () => {
  it('formats valid date string', () => {
    expect(formatDateForCSV('2026-03-15')).toBe('15/03/2026');
  });

  it('formats Date object', () => {
    expect(formatDateForCSV(new Date('2026-01-01T00:00:00Z'))).toBe('01/01/2026');
  });

  it('returns empty for empty string', () => {
    expect(formatDateForCSV('')).toBe('');
  });

  it('returns empty for invalid date', () => {
    expect(formatDateForCSV('not-a-date')).toBe('');
  });

  it('handles ISO date strings', () => {
    const result = formatDateForCSV('2026-12-25T12:00:00Z');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns empty for null-ish', () => {
    // @ts-expect-error testing null input
    expect(formatDateForCSV(null)).toBe('');
    // @ts-expect-error testing undefined input
    expect(formatDateForCSV(undefined)).toBe('');
  });
});

describe('formatDateTimeForCSV', () => {
  it('formats date and time', () => {
    const result = formatDateTimeForCSV('2026-06-15T18:30:00Z');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it('returns empty for empty string', () => {
    expect(formatDateTimeForCSV('')).toBe('');
  });

  it('returns empty for invalid input', () => {
    expect(formatDateTimeForCSV('invalid')).toBe('');
  });

  it('returns empty for null-ish', () => {
    // @ts-expect-error testing null input
    expect(formatDateTimeForCSV(null)).toBe('');
  });
});
