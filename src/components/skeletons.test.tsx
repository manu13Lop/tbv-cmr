// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSkeleton, TableSkeleton, DetailSkeleton, CardGridSkeleton } from './skeletons';

describe('PageSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });
});

describe('TableSkeleton', () => {
  it('renders default 5 rows', () => {
    const { container } = render(<TableSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(7);
  });

  it('renders custom row count', () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(5);
  });
});

describe('DetailSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<DetailSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });
});

describe('CardGridSkeleton', () => {
  it('renders default 6 cards', () => {
    const { container } = render(<CardGridSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(7);
  });

  it('renders custom card count', () => {
    const { container } = render(<CardGridSkeleton count={3} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(4);
  });
});
