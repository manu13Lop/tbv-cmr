// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from './logout-button';

describe('LogoutButton', () => {
  it('renders logout text', () => {
    render(<LogoutButton />);
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('calls logout API and redirects on click', async () => {
    const fetchMock = vi.fn().mockResolvedValue({});
    globalThis.fetch = fetchMock;
    const redirectSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        set href(v: string) {
          redirectSpy(v);
        },
        get href() {
          return '';
        },
      },
      writable: true,
    });

    const user = userEvent.setup();
    render(<LogoutButton />);
    await user.click(screen.getByText('Cerrar sesión'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
  });
});
