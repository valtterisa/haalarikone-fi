import type { University } from '@/types/university';
import {
  getUniversitiesByArea,
  getUniversitiesByColor,
  getUniversitiesByField,
  getUniversitiesByUniversity,
} from '@/lib/get-universities-by-criteria';
import {
  getUniqueAreas,
  getUniqueColors,
  getUniqueFields,
  getUniqueUniversities,
} from '@/lib/get-unique-values';
import { getEntityFromSlug, getEntityTranslation, type Locale } from '@/lib/slug-translations';

export type TaxonomyType = 'university' | 'field' | 'color' | 'area';

export type TaxonomyHub = {
  /** Canonical (Finnish) name — the key translations and slugs are derived from. */
  canonical: string;
  /** The same entity as it appears in `rows`, i.e. localized for the requested locale. */
  localized: string;
  /** Rows belonging to this hub. */
  rows: University[];
};

/**
 * Entity values used to build hub routes.
 * For university/field/area these match the locale of `rows`.
 * For color these are always canonical Finnish `variBase` values when present.
 */
export function getTaxonomyEntities(rows: University[], type: TaxonomyType): string[] {
  if (type === 'university') return getUniqueUniversities(rows);
  if (type === 'field') return getUniqueFields(rows);
  if (type === 'color') return getUniqueColors(rows);
  return getUniqueAreas(rows);
}

/**
 * Resolves a hub slug against rows loaded for the same locale.
 *
 * Rows from `loadUniversities(locale)` carry localized names, but `getEntityFromSlug` returns the
 * canonical Finnish name — so the row filter has to run on the localized name, otherwise nothing
 * matches outside `fi`. Every hub page goes through here so that translation step cannot be
 * skipped.
 */
export function resolveTaxonomyHub(
  rows: University[],
  slug: string,
  locale: Locale,
  type: TaxonomyType,
): TaxonomyHub | null {
  const canonical = getEntityFromSlug(slug, locale, type, getTaxonomyEntities(rows, type));
  if (!canonical) {
    return null;
  }

  const localized = getEntityTranslation(canonical, locale, type);

  if (type === 'university') {
    return { canonical, localized, rows: getUniversitiesByUniversity(rows, localized) };
  }
  if (type === 'field') {
    return { canonical, localized, rows: getUniversitiesByField(rows, localized) };
  }
  if (type === 'color') {
    // `variBase` is canonical in every locale, the `vari` label is not.
    return { canonical, localized, rows: getUniversitiesByColor(rows, localized, canonical) };
  }
  return { canonical, localized, rows: getUniversitiesByArea(rows, localized) };
}
