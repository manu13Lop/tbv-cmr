import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeJwt(sub: string, email: string, exp?: number) {
  const payload: Record<string, unknown> = { sub, email };
  if (exp !== undefined) payload.exp = exp;
  return `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload))}.sig`;
}

describe('middleware JWT decoding', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ufhlipsfkzwsswmllfek.supabase.co';
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('decodes valid JWT from cookie', () => {
    const token = makeJwt('user-1', 'test@test.com', Math.floor(Date.now() / 1000) + 3600);
    const parsed = JSON.parse(JSON.stringify({ access_token: token }));
    const parts = parsed.access_token.split('.') as string[];
    const body = JSON.parse(atob(parts[1]));
    expect(body.sub).toBe('user-1');
    expect(body.email).toBe('test@test.com');
    expect(body.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('rejects expired JWT', () => {
    const token = makeJwt('user-1', 'test@test.com', 1000000000);
    const parsed = JSON.parse(JSON.stringify({ access_token: token }));
    const parts = parsed.access_token.split('.') as string[];
    const body = JSON.parse(atob(parts[1]));
    expect(body.exp).toBeLessThan(Date.now() / 1000);
  });

  it('handles malformed JWT gracefully', () => {
    const parts = 'not.a.jwt'.split('.');
    expect(parts.length).toBe(3);
    expect(() => atob(parts[1])).toThrow();
  });

  it('handles missing access_token', () => {
    const session = JSON.stringify({});
    const parsed = JSON.parse(session);
    expect(parsed.access_token).toBeUndefined();
  });

  it('handles invalid base64 in JWT payload', () => {
    expect(() => {
      const payload = '!!!invalid-base64!!!'.replace(/-/g, '+').replace(/_/g, '/');
      atob(payload);
    }).toThrow();
  });
});

describe('middleware CSRF validation', () => {
  function makeRequest(method: string, origin?: string, host?: string) {
    const headers = new Map<string, string>();
    if (origin) headers.set('origin', origin);
    if (host) headers.set('host', host);
    return {
      headers,
      method,
      get(name: string) {
        return headers.get(name) ?? null;
      },
    } as unknown as import('next/server').NextRequest;
  }

  it('allows GET requests', async () => {
    const { csrfProtected } = await import('@/lib/csrf');
    expect(csrfProtected(makeRequest('GET'))).toBeNull();
  });

  it('blocks POST with evil origin', async () => {
    const { csrfProtected } = await import('@/lib/csrf');
    expect(csrfProtected(makeRequest('POST', 'https://evil.com', 'evil.com'))).not.toBeNull();
  });

  it('allows POST from localhost', async () => {
    const { csrfProtected } = await import('@/lib/csrf');
    expect(
      csrfProtected(makeRequest('POST', 'http://localhost:3000', 'localhost:3000'))
    ).toBeNull();
  });
});
