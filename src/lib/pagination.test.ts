import { describe, it, expect } from 'vitest';

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

describe('getPageNumbers', () => {
  it('returns all pages when total <= 7', () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows first pages when near start', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, '...', 10]);
    expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, 4, '...', 10]);
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, '...', 10]);
  });

  it('shows last pages when near end', () => {
    expect(getPageNumbers(8, 10)).toEqual([1, '...', 7, 8, 9, 10]);
    expect(getPageNumbers(9, 10)).toEqual([1, '...', 7, 8, 9, 10]);
    expect(getPageNumbers(10, 10)).toEqual([1, '...', 7, 8, 9, 10]);
  });

  it('shows middle pages when in middle', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
    expect(getPageNumbers(6, 10)).toEqual([1, '...', 5, 6, 7, '...', 10]);
  });

  it('handles single page', () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
  });

  it('handles exactly 8 pages', () => {
    expect(getPageNumbers(1, 8)).toEqual([1, 2, 3, 4, '...', 8]);
    expect(getPageNumbers(4, 8)).toEqual([1, '...', 3, 4, 5, '...', 8]);
    expect(getPageNumbers(8, 8)).toEqual([1, '...', 5, 6, 7, 8]);
  });
});
