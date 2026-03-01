import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/auth/signin', '/auth/signup', '/joinsession'];
const IGNORED_PREFIXES = ['/_next/static', '/_next/image', '/favicon.ico', '/api', '/images'];

export const proxy = (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const isAuthPage = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  const isLoggedIn = req.cookies.get('session_active')?.value === 'true';

  if (!isLoggedIn && !isAuthPage) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};