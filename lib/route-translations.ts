import { generateSlug } from './generate-slug';

type Locale = 'fi' | 'en' | 'sv';

type RouteType = 'fields' | 'colors' | 'universities' | 'areas' | 'blog' | 'overall';

const routeTranslations: Record<RouteType, Record<Locale, string>> = {
  fields: {
    fi: 'ala',
    en: 'fields',
    sv: 'omraden',
  },
  colors: {
    fi: 'vari',
    en: 'colors',
    sv: 'farger',
  },
  universities: {
    fi: 'oppilaitos',
    en: 'institutions',
    sv: 'institutioner',
  },
  areas: {
    fi: 'alue',
    en: 'areas',
    sv: 'omraden',
  },
  blog: {
    fi: 'blog',
    en: 'blog',
    sv: 'blogg',
  },
  overall: {
    fi: 'haalari',
    en: 'overall',
    sv: 'overall',
  },
};

const reverseRouteMap: Record<string, RouteType> = {
  'ala': 'fields',
  'fields': 'fields',
  'omraden': 'fields',
  'vari': 'colors',
  'colors': 'colors',
  'farger': 'colors',
  'oppilaitos': 'universities',
  'institutions': 'universities',
  'institutioner': 'universities',
  'alue': 'areas',
  'areas': 'areas',
  'blog': 'blog',
  'blogg': 'blog',
  'haalari': 'overall',
  'overall': 'overall',
};

export function getRouteSegment(routeType: RouteType, locale: Locale): string {
  return routeTranslations[routeType][locale];
}

export function getRoutePath(routeType: RouteType, locale: Locale, slug?: string): string {
  const segment = getRouteSegment(routeType, locale);
  return slug ? `/${segment}/${slug}` : `/${segment}`;
}

export function getRouteTypeFromSegment(segment: string): RouteType | null {
  return reverseRouteMap[segment] || null;
}

export function translateRouteSegment(segment: string, fromLocale: Locale, toLocale: Locale): string {
  const routeType = getRouteTypeFromSegment(segment);
  if (!routeType) {
    return segment;
  }
  return getRouteSegment(routeType, toLocale);
}

export function normalizeRouteSegment(segment: string): string {
  const routeType = getRouteTypeFromSegment(segment);
  if (!routeType) {
    return segment;
  }
  return routeTranslations[routeType]['fi'];
}



