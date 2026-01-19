import { useLocale } from 'next-intl';
import { getRoutePath } from './route-translations';
import type { Locale } from './slug-translations';

type RouteType = 'fields' | 'colors' | 'universities' | 'areas' | 'blog' | 'overall';

export function useTranslatedRoutes() {
  const locale = useLocale() as Locale;

  return {
    fields: (slug?: string) => getRoutePath('fields', locale, slug),
    colors: (slug?: string) => getRoutePath('colors', locale, slug),
    universities: (slug?: string) => getRoutePath('universities', locale, slug),
    areas: (slug?: string) => getRoutePath('areas', locale, slug),
    blog: (slug?: string) => getRoutePath('blog', locale, slug),
    overall: (slug?: string) => getRoutePath('overall', locale, slug),
  };
}

export function getTranslatedRoute(routeType: RouteType, locale: Locale, slug?: string): string {
  return getRoutePath(routeType, locale, slug);
}



