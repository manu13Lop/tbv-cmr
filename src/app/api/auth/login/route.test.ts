import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSignInWithPassword = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword: mockSignInWithPassword },
  })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => body,
      cookies: { set: vi.fn() },
    })),
  },
}));

describe('/api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('returns 400 when email missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ password: 'test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when password missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 and user on valid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@test.com' },
        session: {
          access_token:
            'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXN0LmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.sig',
          refresh_token: 'refresh-123',
          expires_at: 9999999999,
          expires_in: 3600,
          token_type: 'bearer',
        },
      },
      error: null,
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'correct' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
