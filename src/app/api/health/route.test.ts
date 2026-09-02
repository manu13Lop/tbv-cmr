import { describe, it, expect, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    constructor(body: unknown, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
    json() {
      return this.body;
    }
  }
  return {
    NextResponse: { json: (b: unknown, i?: { status?: number }) => new MockNextResponse(b, i) },
  };
});

describe('/api/health', () => {
  it('returns healthy when DB and env are ok', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    const { GET } = await import('./route');
    const res = await GET();
    const data = res.json() as Record<string, unknown>;

    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('env');
  });

  it('returns degraded when env vars missing', async () => {
    const orig = { ...process.env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { GET } = await import('./route');
    const res = await GET();
    const data = res.json() as Record<string, unknown>;

    expect(data.status).toBe('degraded');
    expect(data.checks.env.ok).toBe(false);

    process.env = orig;
  });
});
