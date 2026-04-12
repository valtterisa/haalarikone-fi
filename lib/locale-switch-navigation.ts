import { routeHref, type InternalHref, type RouteType } from '@/lib/use-translated-routes';
import { loadUniversitiesSync } from '@/lib/load-universities';
import {
  getUniqueAreas,
  getUniqueColors,
  getUniqueFields,
  getUniqueUniversities,
} from '@/lib/get-unique-values';
import { getEntityFromSlug, getSlugForEntity, type Locale } from '@/lib/slug-translations';
import { routing } from '@/i18n/routing';

type DynamicRouteDef = {
  routeType: RouteType;
  kind: 'taxonomy' | 'overall' | 'blog';
  firstSeg: Record<Locale, string>;
};

type LocalizedPath = { fi: string; en: string; sv: string };

function firstSegment(path: string): string {
  return path.split('/').filter(Boolean)[0] ?? '';
}

function segmentsFor(
  key: '/ala' | '/vari' | '/oppilaitos' | '/alue' | '/blog' | '/haalari/[slug]',
): Record<Locale, string> {
  const v = routing.pathnames[key];
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error(`Expected localized path object for ${key}`);
  }
  const loc = v as LocalizedPath;
  return {
    fi: firstSegment(loc.fi),
    en: firstSegment(loc.en),
    sv: firstSegment(loc.sv),
  };
}

const DYNAMIC_ROUTES: DynamicRouteDef[] = [
  { routeType: 'fields', kind: 'taxonomy', firstSeg: segmentsFor('/ala') },
  { routeType: 'colors', kind: 'taxonomy', firstSeg: segmentsFor('/vari') },
  { routeType: 'universities', kind: 'taxonomy', firstSeg: segmentsFor('/oppilaitos') },
  { routeType: 'areas', kind: 'taxonomy', firstSeg: segmentsFor('/alue') },
  { routeType: 'blog', kind: 'blog', firstSeg: segmentsFor('/blog') },
  { routeType: 'overall', kind: 'overall', firstSeg: segmentsFor('/haalari/[slug]') },
];

let universitiesFiCache: ReturnType<typeof loadUniversitiesSync> | null = null;

function getUniversitiesFi() {
  if (!universitiesFiCache) {
    universitiesFiCache = loadUniversitiesSync('fi');
  }
  return universitiesFiCache;
}

function taxonomyEntityList(
  routeType: RouteType,
  universities: ReturnType<typeof loadUniversitiesSync>,
): string[] {
  if (routeType === 'fields') return getUniqueFields(universities);
  if (routeType === 'colors') return getUniqueColors(universities);
  if (routeType === 'universities') return getUniqueUniversities(universities);
  return getUniqueAreas(universities);
}

function taxonomyEntityType(
  routeType: RouteType,
): 'field' | 'color' | 'university' | 'area' | null {
  if (routeType === 'fields') return 'field';
  if (routeType === 'colors') return 'color';
  if (routeType === 'universities') return 'university';
  if (routeType === 'areas') return 'area';
  return null;
}

export function resolveLocaleSwitchHref(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  fromLocale: Locale,
  toLocale: Locale,
): InternalHref | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const parts = normalized.split('/').filter(Boolean);

  const slugFromParams =
    typeof params.slug === 'string'
      ? params.slug
      : Array.isArray(params.slug)
        ? params.slug[0]
        : undefined;
  const slugFromPath = parts.length >= 2 ? parts[1] : undefined;
  const slug = slugFromParams ?? slugFromPath;

  if (parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    const first = parts[0];
    const def = DYNAMIC_ROUTES.find((d) => d.firstSeg[fromLocale] === first);
    if (!def) return null;
    if (def.routeType === 'overall') {
      return '/';
    }
    return routeHref(def.routeType);
  }

  if (parts.length !== 2) {
    return null;
  }

  const [first] = parts;
  const def = DYNAMIC_ROUTES.find((d) => d.firstSeg[fromLocale] === first);
  if (!def) return null;

  if (!slug) {
    return null;
  }

  if (def.kind === 'overall' || def.kind === 'blog') {
    return routeHref(def.routeType, slug);
  }

  const entityType = taxonomyEntityType(def.routeType);
  if (!entityType) return null;

  const universities = getUniversitiesFi();
  const allEntities = taxonomyEntityList(def.routeType, universities);
  const entity = getEntityFromSlug(slug, fromLocale, entityType, allEntities);
  const newSlug = entity ? getSlugForEntity(entity, toLocale, entityType) : slug;
  return routeHref(def.routeType, newSlug);
}
