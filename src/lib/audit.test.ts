import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } });

vi.mock('./supabase-admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock('./supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  }),
}));

vi.mock('./logger', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('logCambio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('inserta un registro en audit_log con los campos correctos', async () => {
    const { logCambio } = await import('./audit');

    await logCambio('usuarios', 'reg-123', 'crear', null, { nombre: 'Test' });

    expect(mockFrom).toHaveBeenCalledWith('audit_log');
    expect(mockInsert).toHaveBeenCalledWith({
      usuario_id: 'user-1',
      tabla: 'usuarios',
      registro_id: 'reg-123',
      accion: 'crear',
      datos_anteriores: null,
      datos_nuevos: { nombre: 'Test' },
    });
  });

  it('no lanza errores cuando la inserción falla', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const { logCambio } = await import('./audit');

    await expect(
      logCambio('usuarios', 'reg-123', 'crear', null, { nombre: 'Test' })
    ).resolves.toBeUndefined();
  });
});
