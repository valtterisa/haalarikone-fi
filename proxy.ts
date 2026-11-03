import { trackAgents } from '@databuddy/sdk/agents';
import * as nextIntlMiddleware from 'next-intl/middleware';
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { resolveOverallLegacyRedirectPath } from './lib/overall-legacy-redirect';

function resolveCreateMiddleware() {
  const mod = nextIntlMiddleware as {
    default?: unknown;
    createMiddleware?: unknown;
  };
  const candidates = [mod.default, mod.createMiddleware, mod];
  for (const candidate of candidates) {
    if (typeof candidate === 'function') return candidate as typeof nextIntlMiddleware.default;
    if (
      candidate &&
      typeof candidate === 'object' &&
      typeof (candidate as { default?: unknown }).default === 'function'
    ) {
      return (candidate as { default: typeof nextIntlMiddleware.default }).default;
    }
  }
  throw new Error('next-intl/middleware: createMiddleware export not found');
}

const intlMiddleware = resolveCreateMiddleware()(routing);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
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
    '/((?!api|_next|_vercel|.*\\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|pdf|zip)$).*)',
  ],
};
