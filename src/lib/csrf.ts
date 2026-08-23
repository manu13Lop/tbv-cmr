import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin && !host) return false;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!ALLOWED_ORIGINS.includes(originUrl.origin)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (host) {
    const allowedHosts = ALLOWED_ORIGINS.map((o) => {
      try {
        return new URL(o).host;
      } catch {
        return o;
      }
    });
    if (!allowedHosts.includes(host)) {
      return false;
    }
  }

  return true;
}

export function csrfProtected(request: NextRequest): NextResponse | null {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed: invalid origin' },
        { status: 403 }
      );
    }
  }
  return null;
}
