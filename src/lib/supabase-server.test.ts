import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'x-user-id') return 'user-1';
      return null;
    }),
  }),
}));

vi.mock('./supabase-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { rol_id: 'rol-1', es_master: false },
        error: null,
      }),
    }),
  })),
}));

describe('supabase-server', () => {
  it('createClient returns supabase client', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    const { createClient } = await import('./supabase-server');
    const client = await createClient();
    expect(client).toBeDefined();
  });

  it('getPermisosUsuario returns empty for no userId', async () => {
    const { headers } = await import('next/headers');
    const mockHeaders = await headers();
    (mockHeaders.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const { getPermisosUsuario } = await import('./supabase-server');
    const permisos = await getPermisosUsuario();
    expect(permisos).toEqual([]);
  });
});
