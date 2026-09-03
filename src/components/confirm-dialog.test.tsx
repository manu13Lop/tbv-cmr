// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './confirm-dialog';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Eliminar jugadora"
        description="¿Estás seguro?"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Eliminar jugadora')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Test"
        description="Desc"
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange with false when cancel clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Test"
        description="Desc"
        onConfirm={vi.fn()}
      />
    );
    await user.click(screen.getByText('Cancelar'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses custom labels', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Test"
        description="Desc"
        confirmLabel="Sí, borrar"
        cancelLabel="No, volver"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Sí, borrar')).toBeInTheDocument();
    expect(screen.getByText('No, volver')).toBeInTheDocument();
  });
});
