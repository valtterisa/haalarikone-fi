import { trackAgents } from '@databuddy/sdk/agents';
import createMiddleware from 'next-intl/middleware';
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { resolveOverallLegacyRedirectPath } from './lib/overall-legacy-redirect';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  event.waitUntil(trackAgents(request));

  if (/\.(?:mdx?|txt)$/i.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const target = resolveOverallLegacyRedirectPath(request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/(fi|en|sv)/:path*',
    '/:path*.md',
    '/:path*.mdx',
    '/:path*.txt',
  ],
};
