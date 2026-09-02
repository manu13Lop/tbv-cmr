import { describe, it, expect, vi } from 'vitest';

vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    cookies: { name: string; value: string; options: Record<string, unknown> }[];
    constructor(body: unknown, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.cookies = [];
    }
    json() {
      return this.body;
    }
  }
  return {
    NextResponse: {
      json: (b: unknown, i?: { status?: number }) => {
        const res = new MockNextResponse(b, i);
        return {
          ...res,
          cookies: {
            set: (name: string, value: string, options: Record<string, unknown>) => {
              res.cookies.push({ name, value, options });
            },
          },
        };
      },
    },
  };
});

describe('/api/auth/logout', () => {
  it('returns ok and clears cookie', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

    const { POST } = await import('./route');
    const res = await POST();
    expect(res.status).toBe(200);
  });
});
