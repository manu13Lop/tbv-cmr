// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastHandler } from './toast-handler';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ToastHandler', () => {
  it('renders nothing', () => {
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe('');
  });
});
