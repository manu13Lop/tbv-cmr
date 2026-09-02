import { describe, it, expect, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Headers;
    constructor(input: string | URL, init?: RequestInit) {
      this.url = input instanceof URL ? input.toString() : input;
      this.method = init?.method ?? 'GET';
      this.headers = new Headers(init?.headers as HeadersInit);
    }
  },
  NextResponse: {
    json: vi.fn((body: unknown, init?: ResponseInit) => ({
      body,
      status: init?.status ?? 200,
      statusText: init?.statusText ?? 'OK',
    })),
  },
}));

function makeMockRequest(origin?: string, host?: string, method = 'POST') {
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

describe('validateOrigin', () => {
  it('allows requests from localhost:3000', async () => {
    const { validateOrigin } = await import('./csrf');
    expect(validateOrigin(makeMockRequest('http://localhost:3000', 'localhost:3000'))).toBe(true);
  });

  it('rejects requests from unknown origins', async () => {
    const { validateOrigin } = await import('./csrf');
    expect(validateOrigin(makeMockRequest('https://evil.com', 'evil.com'))).toBe(false);
  });

  it('rejects when no origin and no host', async () => {
    const { validateOrigin } = await import('./csrf');
    expect(validateOrigin(makeMockRequest())).toBe(false);
  });

  it('rejects invalid origin URL', async () => {
    const { validateOrigin } = await import('./csrf');
    expect(validateOrigin(makeMockRequest('not-a-url', 'localhost:3000'))).toBe(false);
  });
});

describe('csrfProtected', () => {
  it('returns null for GET requests', async () => {
    const { csrfProtected } = await import('./csrf');
    expect(csrfProtected(makeMockRequest(undefined, undefined, 'GET'))).toBeNull();
  });

  it('returns 403 for POST with evil origin', async () => {
    const { csrfProtected } = await import('./csrf');
    const result = csrfProtected(makeMockRequest('https://evil.com', 'evil.com'));
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it('returns null for POST with valid origin', async () => {
    const { csrfProtected } = await import('./csrf');
    const result = csrfProtected(makeMockRequest('http://localhost:3000', 'localhost:3000'));
    expect(result).toBeNull();
  });
});
