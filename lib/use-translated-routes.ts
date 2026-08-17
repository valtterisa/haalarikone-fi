import { getPathname } from '@/i18n/routing';
import { SITE_ORIGIN } from '@/lib/site-url';
import type { Locale } from './slug-translations';

export type RouteType = 'fields' | 'colors' | 'universities' | 'areas' | 'blog' | 'overall';

export type InternalHref =
  | '/'
  | '/ala'
  | '/vari'
  | '/oppilaitos'
  | '/alue'
  | '/blog'
  | { pathname: '/ala/[slug]'; params: { slug: string } }
  | { pathname: '/vari/[slug]'; params: { slug: string } }
  | { pathname: '/oppilaitos/[slug]'; params: { slug: string } }
  | { pathname: '/alue/[slug]'; params: { slug: string } }
  | { pathname: '/blog/[slug]'; params: { slug: string } }
  | { pathname: '/haalari/[slug]'; params: { slug: string } };

export function routeHref(routeType: RouteType, slug?: string): InternalHref {
  switch (routeType) {
    case 'fields':
      return slug ? { pathname: '/ala/[slug]', params: { slug } } : '/ala';
    case 'colors':
      return slug ? { pathname: '/vari/[slug]', params: { slug } } : '/vari';
    case 'universities':
      return slug ? { pathname: '/oppilaitos/[slug]', params: { slug } } : '/oppilaitos';
    case 'areas':
      return slug ? { pathname: '/alue/[slug]', params: { slug } } : '/alue';
    case 'blog':
      return slug ? { pathname: '/blog/[slug]', params: { slug } } : '/blog';
    case 'overall': {
      const s = slug?.trim();
      if (!s) {
        throw new Error('routeHref(overall): a non-empty slug is required');
      }
      return { pathname: '/haalari/[slug]', params: { slug: s } };
    }
  }
}

export function useTranslatedRoutes() {
  return {
    fields: (slug?: string) => routeHref('fields', slug),
    colors: (slug?: string) => routeHref('colors', slug),
    universities: (slug?: string) => routeHref('universities', slug),
    areas: (slug?: string) => routeHref('areas', slug),
    blog: (slug?: string) => routeHref('blog', slug),
    overall: (slug: string) => routeHref('overall', slug),
  };
}

export function getTranslatedRoute(routeType: RouteType, locale: Locale, slug?: string): string {
  return getPathname({
    locale,
    href: routeHref(routeType, slug) as never, // next-intl getPathname typings are stricter than routeHref; this href is valid for localized resolution.
  });
}

export function absoluteTranslatedRoute(
  routeType: RouteType,
  locale: Locale,
  slug?: string,
): string {
  return `${SITE_ORIGIN}${getTranslatedRoute(routeType, locale, slug)}`;
}

export function absoluteHomeUrl(locale: Locale): string {
  return `${SITE_ORIGIN}${getPathname({ locale, href: '/' })}`;
}

const TAXONOMY_ROUTE_TYPES: RouteType[] = ['fields', 'colors', 'universities', 'areas'];

export function withXDefault(languages: { fi: string; en: string; sv: string }) {
  return {
    ...languages,
    'x-default': languages.fi,
  };
}

export function alternateLanguageUrls(routeType: RouteType, slug?: string) {
  if (slug !== undefined && TAXONOMY_ROUTE_TYPES.includes(routeType)) {
    throw new Error(
      'alternateLanguageUrls: taxonomy routes with a slug need per-locale slugs; use explicit alternates with getSlugForEntity or extend this API with a Record<Locale, string> slug map',
    );
  }
  return withXDefault({
    fi: absoluteTranslatedRoute(routeType, 'fi', slug),
    en: absoluteTranslatedRoute(routeType, 'en', slug),
    sv: absoluteTranslatedRoute(routeType, 'sv', slug),
  });
}
