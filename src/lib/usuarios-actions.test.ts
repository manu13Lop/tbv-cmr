import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUsuarioActual = vi.fn();
const mockCrearUsuarioRL = vi.fn().mockResolvedValue({ allowed: true });
const mockResetPasswordRL = vi.fn().mockResolvedValue({ allowed: true });

vi.mock('./supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  }),
}));

vi.mock('./supabase-admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  })),
}));

vi.mock('./auth-helpers', () => ({
  getUsuarioActual: mockGetUsuarioActual,
  tienePermiso: vi.fn().mockResolvedValue(true),
}));

vi.mock('./audit', () => ({
  logCambio: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
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

vi.mock('./roles', () => ({
  clearRolesCache: vi.fn(),
}));

vi.mock('./rate-limit', () => ({
  rateLimiters: {
    crearUsuario: mockCrearUsuarioRL,
    resetPassword: mockResetPasswordRL,
    enviarConvocatoria: vi.fn().mockResolvedValue({ allowed: true }),
  },
}));

describe('usuarios-actions auth guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crearUsuario rechaza si no es master', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: false });

    const { crearUsuario } = await import('./usuarios-actions');
    const fd = new FormData();
    fd.set('nombre', 'Test');
    fd.set('apellidos', 'User');
    fd.set('email', 'test@test.com');
    fd.set('password', '12345678');
    fd.set('rol_id', '550e8400-e29b-41d4-a716-446655440000');

    const result = await crearUsuario(fd);
    expect(result).toBeUndefined();
  });

  it('crearRol rechaza si no es master', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: false });

    const { crearRol } = await import('./usuarios-actions');
    const fd = new FormData();
    fd.set('nombre', 'Test Role');

    const result = await crearRol(fd);
    expect(result).toBeUndefined();
  });

  it('crearPermiso rechaza si no es master', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: false });

    const { crearPermiso } = await import('./usuarios-actions');
    const fd = new FormData();
    fd.set('nombre', 'test_permiso');
    fd.set('descripcion', 'Test');

    const result = await crearPermiso(fd);
    expect(result).toBeUndefined();
  });

  it('eliminarUsuario rechaza si no es master', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: false });

    const { eliminarUsuario } = await import('./usuarios-actions');
    const result = await eliminarUsuario('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBeUndefined();
  });

  it('cambiarRol rechaza UUID inválido', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: true });

    const { cambiarRol } = await import('./usuarios-actions');
    const fd = new FormData();
    fd.set('rol_id', 'invalid-uuid');

    const result = await cambiarRol('not-a-uuid', fd);
    expect(result).toBeUndefined();
  });

  it('resetearPassword rechaza si no es master', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: false });

    const { resetearPassword } = await import('./usuarios-actions');
    const result = await resetearPassword('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBeUndefined();
  });
});

describe('rate limiting integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rateLimiters.crearUsuario es llamado con el id del usuario', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: true });

    const { crearUsuario } = await import('./usuarios-actions');

    const fd = new FormData();
    fd.set('nombre', 'Test');
    fd.set('apellidos', 'User');
    fd.set('email', 'test@test.com');
    fd.set('password', '12345678');
    fd.set('rol_id', '550e8400-e29b-41d4-a716-446655440000');

    await crearUsuario(fd).catch(() => {});
    expect(mockCrearUsuarioRL).toHaveBeenCalledWith('u1');
  });

  it('rateLimiters.resetPassword es llamado con el id del usuario', async () => {
    mockGetUsuarioActual.mockResolvedValue({ id: 'u1', esMaster: true });

    const { resetearPassword } = await import('./usuarios-actions');

    await resetearPassword('550e8400-e29b-41d4-a716-446655440000').catch(() => {});
    expect(mockResetPasswordRL).toHaveBeenCalledWith('u1');
  });
});
