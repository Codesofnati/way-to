import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ✅ 1. Force root '/' to go to '/en/auth'
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en/auth', request.url));
  }

  // ✅ 2. If user visits just '/en' or '/am', redirect them to the auth page
  if (pathname === '/en' || pathname === '/am') {
    return NextResponse.redirect(new URL(`${pathname}/auth`, request.url));
  }

  // ✅ 3. Let next-intl handle everything else (like /en/dashboard, /am/tasks)
  return intlMiddleware(request);
}

export const config = {
  // ✅ Keep your matcher, but exclude api, _next, etc.
  matcher: ['/((?!api|_next|.*\\..*).*)']
};