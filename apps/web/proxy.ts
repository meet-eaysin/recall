import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/app'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('ms_access_token');
  const refreshToken = request.cookies.get('ms_refresh_token');
  const isAuthenticated = !!(accessToken || refreshToken);

  const isProtectedPath = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const isAuthOrLanding = pathname.startsWith('/auth/');

  if (isProtectedPath) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } else if (isAuthenticated && isAuthOrLanding) {
    const appUrl = new URL('/app', request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export default proxy;
