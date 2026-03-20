import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define paths that DO NOT require a login
  const isPublicPath = path === '/login' || path === '/register' || path === '/';

  // 2. Grab the secure token from the cookies
  const token = request.cookies.get('token')?.value || '';

  // 3. If they are logged in and try to go to auth pages, send them to Home
  if ((path === '/login' || path === '/register') && token) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // 4. If they are NOT logged in, and try to access a protected page (like Chat or History),
  // redirect them to Login.
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

// 5. Tell Next.js which routes to run this logic on
export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/history',
    '/analytics',
    '/login',
    '/register'
  ],
};