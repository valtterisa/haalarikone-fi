import { generateSlug } from './generate-slug';
import { getLocalizedName, translationsMap } from './get-finnish-name';

export type Locale = 'fi' | 'en' | 'sv';

type EntityType = 'field' | 'color' | 'university' | 'area';

export function getEntityTranslation(entity: string, locale: Locale, type: EntityType): string {
  return getLocalizedName(entity, locale, type);
}

export function getSlugForEntity(entity: string, locale: Locale, type: EntityType): string {
  const translated = getEntityTranslation(entity, locale, type);
  return generateSlug(translated);
}

export function getEntityFromSlug(
  slug: string,
  locale: Locale,
  type: EntityType,
  allEntities: string[],
): string | null {
  const map = translationsMap(type);

  for (const entity of allEntities) {
    if (map[entity] && generateSlug(getLocalizedName(entity, locale, type)) === slug) {
      return entity;
    }
  }

  for (const canonicalEntity of Object.keys(map)) {
    if (generateSlug(getLocalizedName(canonicalEntity, locale, type)) === slug) {
      return canonicalEntity;
    }
  }

  for (const entity of allEntities) {
    if (generateSlug(entity) === slug) {
      return entity;
    }
  }

  return null;
}

export function getCanonicalSlug(entity: string, type: EntityType): string {
  return generateSlug(entity);
}
