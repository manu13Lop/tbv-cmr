// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteButton } from './delete-button';

describe('DeleteButton', () => {
  it('renders with default label', () => {
    render(<DeleteButton action={vi.fn()} />);
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<DeleteButton action={vi.fn()} label="Borrar" />);
    expect(screen.getByText('Borrar')).toBeInTheDocument();
  });

  it('opens confirmation dialog on click', async () => {
    render(<DeleteButton action={vi.fn()} />);
    fireEvent.click(screen.getByText('Eliminar'));
    expect(await screen.findByText('Confirmar eliminación')).toBeInTheDocument();
    expect(
      screen.getByText('Esta acción no se puede deshacer. ¿Estás segura de que quieres eliminarlo?')
    ).toBeInTheDocument();
  });
});
