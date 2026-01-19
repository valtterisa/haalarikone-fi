import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from "next/server";
import { normalizeRouteSegment } from '@/lib/route-translations';

const intlMiddleware = createMiddleware(routing);

function translateRoute(request: NextRequest): NextRequest | null {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  let localeIndex = 0;
  let locale = pathSegments[0];
  const isLocaleSegment = routing.locales.includes(locale as any);

  if (!isLocaleSegment) {
    locale = routing.defaultLocale;
    localeIndex = -1;
  }

  const routeSegmentIndex = isLocaleSegment ? 1 : 0;

  if (pathSegments.length <= routeSegmentIndex) {
    return null;
  }

  const routeSegment = pathSegments[routeSegmentIndex];
  const normalizedSegment = normalizeRouteSegment(routeSegment);

  if (normalizedSegment === routeSegment) {
    return null;
  }

  pathSegments[routeSegmentIndex] = normalizedSegment;
  url.pathname = '/' + pathSegments.join('/');

  return new NextRequest(url, request);
}

export async function middleware(request: NextRequest) {
  const translatedRequest = translateRoute(request);
  const requestToUse = translatedRequest || request;

  return intlMiddleware(requestToUse);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/(fi|en|sv)/:path*'
  ]
};
