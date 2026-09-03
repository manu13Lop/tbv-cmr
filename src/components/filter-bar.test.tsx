// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterBar } from './filter-bar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('FilterBar', () => {
  it('renders filter selects', () => {
    render(
      <FilterBar
        filters={[
          {
            key: 'categoria',
            label: 'Categoria',
            options: [
              { value: 'juvenil', label: 'Juvenil' },
              { value: 'cadete', label: 'Cadete' },
            ],
          },
        ]}
      />
    );
    expect(screen.getByText('Categoria')).toBeInTheDocument();
    expect(screen.getByText('Juvenil')).toBeInTheDocument();
  });

  it('renders multiple filters', () => {
    render(
      <FilterBar
        filters={[
          { key: 'cat', label: 'Cat', options: [{ value: 'a', label: 'A' }] },
          { key: 'nivel', label: 'Nivel', options: [{ value: 'b', label: 'B' }] },
        ]}
      />
    );
    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByText('Nivel')).toBeInTheDocument();
  });
});
