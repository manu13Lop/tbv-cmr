import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockNeq = vi.fn();
const mockIn = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit.mockReturnValue({ data: [], error: null }),
        }),
        single: mockLimit.mockReturnValue({ data: null, error: null }),
      }),
      neq: mockNeq.mockReturnValue({
        data: [],
        error: null,
      }),
      in: mockIn.mockReturnValue({
        data: [],
        error: null,
      }),
    }),
    insert: mockInsert.mockResolvedValue({ error: null }),
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'current-user' } },
    }),
  },
};

vi.mock('./supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

describe('crearNotificacion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserta una notificación con los campos correctos', async () => {
    const { crearNotificacion } = await import('./notifications');

    await crearNotificacion('user-123', 'convocatoria', 'Test Title', 'Desc', '/link');

    expect(mockSupabase.from).toHaveBeenCalledWith('notificaciones');
    expect(mockInsert).toHaveBeenCalledWith({
      usuario_id: 'user-123',
      tipo: 'convocatoria',
      titulo: 'Test Title',
      descripcion: 'Desc',
      enlace: '/link',
    });
  });

  it('inserta notificación sin campos opcionales', async () => {
    const { crearNotificacion } = await import('./notifications');

    await crearNotificacion('user-123', 'general', 'Simple');

    expect(mockInsert).toHaveBeenCalledWith({
      usuario_id: 'user-123',
      tipo: 'general',
      titulo: 'Simple',
      descripcion: null,
      enlace: null,
    });
  });
});
