import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { resolveOverallLegacyRedirectPath } from './lib/overall-legacy-redirect';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const target = resolveOverallLegacyRedirectPath(request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/(fi|en|sv)/:path*'],
};
