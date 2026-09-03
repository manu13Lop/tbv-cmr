import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map([['x-user-id', 'user-1']]) as unknown as Headers),
}));

const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('./supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      insert: mockInsert,
    })),
  }),
}));

describe('notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('getNotificacionesUsuario returns array', async () => {
    const { getNotificacionesUsuario } = await import('./notifications');
    const result = await getNotificacionesUsuario('user-1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('crearNotificacion calls insert', async () => {
    const { crearNotificacion } = await import('./notifications');
    await crearNotificacion('user-1', 'info', 'Test titulo');
    expect(mockInsert).toHaveBeenCalled();
  });
});
