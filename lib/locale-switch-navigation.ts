import { routeHref, type InternalHref, type RouteType } from '@/lib/use-translated-routes';
import { loadUniversitiesSync } from '@/lib/load-universities';
import {
  getUniqueAreas,
  getUniqueColors,
  getUniqueFields,
  getUniqueUniversities,
} from '@/lib/get-unique-values';
import { getEntityFromSlug, getSlugForEntity, type Locale } from '@/lib/slug-translations';

type DynamicRouteDef = {
  routeType: RouteType;
  kind: 'taxonomy' | 'overall' | 'blog';
  firstSeg: Record<Locale, string>;
};

const DYNAMIC_ROUTES: DynamicRouteDef[] = [
  { routeType: 'fields', kind: 'taxonomy', firstSeg: { fi: 'ala', en: 'fields', sv: 'omraden' } },
  { routeType: 'colors', kind: 'taxonomy', firstSeg: { fi: 'vari', en: 'colors', sv: 'farger' } },
  {
    routeType: 'universities',
    kind: 'taxonomy',
    firstSeg: { fi: 'oppilaitos', en: 'institutions', sv: 'institutioner' },
  },
  { routeType: 'areas', kind: 'taxonomy', firstSeg: { fi: 'alue', en: 'areas', sv: 'regioner' } },
  { routeType: 'blog', kind: 'blog', firstSeg: { fi: 'blog', en: 'blog', sv: 'blogg' } },
  {
    routeType: 'overall',
    kind: 'overall',
    firstSeg: { fi: 'haalari', en: 'overall', sv: 'overaller' },
  },
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
  const slug =
    typeof params.slug === 'string'
      ? params.slug
      : Array.isArray(params.slug)
        ? params.slug[0]
        : undefined;
  if (!slug) return null;

  const normalized = pathname.replace(/\/$/, '') || '/';
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length !== 2) return null;

  const [first] = parts;
  const def = DYNAMIC_ROUTES.find((d) => d.firstSeg[fromLocale] === first);
  if (!def) return null;

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
