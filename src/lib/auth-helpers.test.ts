import { describe, it, expect, vi } from 'vitest';
import { tienePermiso } from './auth-helpers';

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(),
}));

describe('tienePermiso', () => {
  it('retorna true si el permiso existe', () => {
    const permisos = ['jugadoras.leer', 'jugadoras.editar'];
    expect(tienePermiso(permisos, 'jugadoras.leer')).toBe(true);
  });

  it('retorna false si el permiso no existe', () => {
    const permisos = ['jugadoras.leer'];
    expect(tienePermiso(permisos, 'usuarios.gestionar')).toBe(false);
  });

  it('retorna false si permisos es undefined', () => {
    expect(tienePermiso(undefined, 'jugadoras.leer')).toBe(false);
  });

  it('retorna false si permisos es un array vacío', () => {
    expect(tienePermiso([], 'jugadoras.leer')).toBe(false);
  });

  it('maneja permisos con formato punto correctamente', () => {
    const permisos = [
      'formacion.leer',
      'formacion.editar',
      'formacion.administrar',
      'auditoria.leer',
    ];
    expect(tienePermiso(permisos, 'formacion.leer')).toBe(true);
    expect(tienePermiso(permisos, 'formacion.administrar')).toBe(true);
    expect(tienePermiso(permisos, 'auditoria.leer')).toBe(true);
    expect(tienePermiso(permisos, 'auditoria.administrar')).toBe(false);
  });
});
