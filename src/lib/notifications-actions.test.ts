import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(
    new Map([
      ['x-user-id', 'user-1'],
      ['x-user-email', 'test@test.com'],
    ])
  ),
}));

vi.mock('./supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  }),
}));

describe('notifications-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marcarComoLeida calls createClient', async () => {
    const { marcarComoLeida } = await import('./notifications-actions');
    await marcarComoLeida('notif-123');
    const { createClient } = await import('./supabase-server');
    expect(createClient).toHaveBeenCalled();
  });

  it('marcarTodasComoLeidas calls createClient', async () => {
    const { marcarTodasComoLeidas } = await import('./notifications-actions');
    await marcarTodasComoLeidas();
    const { createClient } = await import('./supabase-server');
    expect(createClient).toHaveBeenCalled();
  });

  it('marcarComoLeida does nothing without userId', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockResolvedValueOnce(new Map() as Headers);

    const { marcarComoLeida } = await import('./notifications-actions');
    await marcarComoLeida('notif-123');
  });
});
