import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfProtected } from '@/lib/csrf';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const raw = parts[1];
    if (!raw) return null;
    const payload = raw.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getUserFromCookies(request: NextRequest): { id: string; email: string } | null {
  const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
  const cookie = request.cookies.get(cookieName);
  if (!cookie?.value) return null;

  try {
    const decoded = decodeURIComponent(cookie.value);
    const session = JSON.parse(decoded);
    const accessToken = session?.access_token;
    if (!accessToken) return null;

    const payload = decodeJwtPayload(accessToken);
    if (!payload) return null;

    const exp = payload.exp as number | undefined;
    if (exp && exp < Date.now() / 1000) return null;

    return {
      id: payload.sub as string,
      email: (payload.email as string) || '',
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const csrfResponse = csrfProtected(request);
  if (csrfResponse) return csrfResponse;

  const user = getUserFromCookies(request);
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!user && !isLoginPage) {
    const returnTo = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next({ request });

  if (user) {
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/|api/health|api/admin/).*)'],
};
