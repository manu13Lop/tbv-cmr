import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUsuarioActual = vi.fn();
const mockRateLimiters = {
  crearUsuario: vi.fn().mockResolvedValue({ allowed: true }),
};

vi.mock('./supabase-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: { id: 'ej-1' }, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'http://example.com/test.jpg' } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  })),
}));

vi.mock('./auth-helpers', () => ({
  getUsuarioActual: mockGetUsuarioActual,
}));

vi.mock('./audit', () => ({
  logCambio: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./rate-limit', () => ({
  rateLimiters: mockRateLimiters,
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('./validate', () => ({
  validateFormData: vi
    .fn()
    .mockReturnValue({ success: true, data: { titulo: 'Test', seccion_principal: 'Tiro' } }),
  getFirstError: vi.fn().mockReturnValue('Error'),
}));

describe('ejercicios-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUsuarioActual.mockResolvedValue({ id: 'user-1', esMaster: true });
  });

  it('crearEjercicio redirects if no user', async () => {
    mockGetUsuarioActual.mockResolvedValueOnce(null);
    const { crearEjercicio } = await import('./ejercicios-actions');
    const fd = new FormData();
    fd.set('titulo', 'Test');
    fd.set('seccion_principal', 'Tiro');
    await expect(crearEjercicio(fd)).rejects.toThrow('REDIRECT:/ejercicios?error=no_autorizado');
  });

  it('crearEjercicio redirects on rate limit', async () => {
    mockRateLimiters.crearUsuario.mockResolvedValueOnce({ allowed: false });
    const { crearEjercicio } = await import('./ejercicios-actions');
    const fd = new FormData();
    fd.set('titulo', 'Test');
    await expect(crearEjercicio(fd)).rejects.toThrow('REDIRECT:/ejercicios?error=rate_limit');
  });

  it('valorarEjercicio returns error if no user', async () => {
    mockGetUsuarioActual.mockResolvedValueOnce(null);
    const { valorarEjercicio } = await import('./ejercicios-actions');
    const result = await valorarEjercicio('ej-1', 5, 'Muy bien');
    expect(result).toEqual({ success: false, error: 'No autorizado' });
  });

  it('eliminarEjercicio redirects to /ejercicios', async () => {
    const { eliminarEjercicio } = await import('./ejercicios-actions');
    await expect(eliminarEjercicio('ej-1')).rejects.toThrow('REDIRECT:/ejercicios');
  });

  it('eliminarEjercicio denies non-owner non-master', async () => {
    mockGetUsuarioActual.mockResolvedValueOnce({ id: 'user-2', esMaster: false });
    const { eliminarEjercicio } = await import('./ejercicios-actions');
    await expect(eliminarEjercicio('ej-1')).rejects.toThrow(
      'REDIRECT:/ejercicios?error=Sin permisos'
    );
  });

  it('editarEjercicio denies non-owner non-master', async () => {
    mockGetUsuarioActual.mockResolvedValueOnce({ id: 'user-2', esMaster: false });
    const { editarEjercicio } = await import('./ejercicios-actions');
    const fd = new FormData();
    fd.set('titulo', 'Updated');
    fd.set('seccion_principal', 'Tiro');
    await expect(editarEjercicio('ej-1', fd)).rejects.toThrow(
      'REDIRECT:/ejercicios/ej-1?error=Sin permisos'
    );
  });

  it('crearVariante redirects on rate limit', async () => {
    mockRateLimiters.crearUsuario.mockResolvedValueOnce({ allowed: false });
    const { crearVariante } = await import('./ejercicios-actions');
    const fd = new FormData();
    fd.set('titulo', 'Variante');
    await expect(crearVariante('ej-1', fd)).rejects.toThrow(
      'REDIRECT:/ejercicios?error=rate_limit'
    );
  });

  it('eliminarVariante redirects', async () => {
    const { eliminarVariante } = await import('./ejercicios-actions');
    await expect(eliminarVariante('v-1', 'ej-1')).rejects.toThrow('REDIRECT:/ejercicios/ej-1');
  });
});
