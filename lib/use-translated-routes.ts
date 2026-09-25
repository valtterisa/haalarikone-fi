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
  | '/tietosuoja'
  | '/kayttoehdot'
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

export function absoluteUrl(locale: Locale, href: InternalHref): string {
  return `${SITE_ORIGIN}${getPathname({ locale, href: href as never })}`;
}
