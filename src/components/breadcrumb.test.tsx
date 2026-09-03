// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from './breadcrumb';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/jugadoras'),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Breadcrumb', () => {
  it('renders home link', () => {
    render(<Breadcrumb />);
    const homeLink = screen.getByRole('link').getAttribute('href');
    expect(homeLink).toBe('/');
  });

  it('shows segment label from labelMap', () => {
    render(<Breadcrumb />);
    expect(screen.getByText('Jugadoras')).toBeInTheDocument();
  });

  it('renders nothing for root path', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/');
    const { container } = render(<Breadcrumb />);
    expect(container.querySelector('nav')).toBeNull();
  });
});
