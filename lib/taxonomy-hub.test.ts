import { beforeAll, describe, expect, it } from 'vitest';
import {
  getUniversitiesByArea,
  getUniversitiesByField,
  getUniversitiesByUniversity,
} from '@/lib/get-universities-by-criteria';
import { loadUniversities } from '@/lib/load-universities';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';
import { getTaxonomyEntities, resolveTaxonomyHub, type TaxonomyType } from '@/lib/taxonomy-hub';
import type { University } from '@/types/university';

const LOCALES: Locale[] = ['fi', 'en', 'sv'];
const TYPES: TaxonomyType[] = ['university', 'field', 'color', 'area'];

const byLocale: Record<Locale, University[]> = {
  fi: [],
  en: [],
  sv: [],
};

beforeAll(async () => {
  const [fi, en, sv] = await Promise.all([
    loadUniversities('fi'),
    loadUniversities('en'),
    loadUniversities('sv'),
  ]);
  byLocale.fi = fi;
  byLocale.en = en;
  byLocale.sv = sv;
});

function filterByFinnishName(
  rows: University[],
  type: Exclude<TaxonomyType, 'color'>,
  canonical: string,
): University[] {
  if (type === 'university') return getUniversitiesByUniversity(rows, canonical);
  if (type === 'field') return getUniversitiesByField(rows, canonical);
  return getUniversitiesByArea(rows, canonical);
}

describe('taxonomy hub pages', () => {
  for (const type of TYPES) {
    for (const locale of LOCALES) {
      it(`every ${type} hub page has results in ${locale}`, () => {
        const canonicalEntities = getTaxonomyEntities(byLocale.fi, type);
        expect(canonicalEntities.length).toBeGreaterThan(0);

        const empty: string[] = [];

        for (const canonical of canonicalEntities) {
          const slug = getSlugForEntity(canonical, locale, type);
          const hub = resolveTaxonomyHub(byLocale[locale], slug, locale, type);
          if (!hub) {
            empty.push(`${canonical} -> /${slug} (slug did not resolve)`);
          } else if (hub.rows.length === 0) {
            empty.push(`${canonical} -> /${slug} (resolved to "${hub.canonical}", 0 rows)`);
          }
        }

        expect(empty).toEqual([]);
      });
    }
  }

  it('resolves a localized slug back to the canonical Finnish entity', () => {
    const hub = resolveTaxonomyHub(byLocale.en, 'university-of-turku', 'en', 'university');

    expect(hub?.canonical).toBe('Turun yliopisto');
    expect(hub?.localized).toBe('University of Turku');
    expect(hub?.rows.length).toBeGreaterThan(0);
    expect(hub?.rows.every((u) => u.oppilaitos === 'University of Turku')).toBe(true);
  });

  it('matches colors by canonical base across locales', () => {
    const fi = resolveTaxonomyHub(byLocale.fi, 'vihrea', 'fi', 'color');
    const en = resolveTaxonomyHub(byLocale.en, 'green', 'en', 'color');
    const sv = resolveTaxonomyHub(byLocale.sv, 'gron', 'sv', 'color');

    expect(fi?.rows.length).toBeGreaterThan(0);
    expect(en?.rows.length).toBe(fi?.rows.length);
    expect(sv?.rows.length).toBe(fi?.rows.length);
  });

  it('returns null for an unknown slug', () => {
    expect(resolveTaxonomyHub(byLocale.en, 'not-a-real-university', 'en', 'university')).toBeNull();
  });

  it('documents the original empty-hub bug: Finnish name against en/sv rows finds nothing', () => {
    expect(getUniversitiesByUniversity(byLocale.en, 'Turun yliopisto')).toEqual([]);
    expect(getUniversitiesByUniversity(byLocale.sv, 'Turun yliopisto')).toEqual([]);

    const en = resolveTaxonomyHub(byLocale.en, 'university-of-turku', 'en', 'university');
    const sv = resolveTaxonomyHub(byLocale.sv, 'abo-universitet', 'sv', 'university');
    const fi = resolveTaxonomyHub(byLocale.fi, 'turun-yliopisto', 'fi', 'university');

    expect(fi?.rows.length).toBeGreaterThan(0);
    expect(en?.rows.length).toBe(fi?.rows.length);
    expect(sv?.rows.length).toBe(fi?.rows.length);
    expect(en?.localized).toBe('University of Turku');
    expect(sv?.localized).toBe('Åbo universitet');
  });

  it('resolves every translated hub that a Finnish-name filter would miss', () => {
    const failures: string[] = [];
    const types: Exclude<TaxonomyType, 'color'>[] = ['university', 'field', 'area'];

    for (const type of types) {
      for (const locale of LOCALES.filter((l) => l !== 'fi')) {
        for (const canonical of getTaxonomyEntities(byLocale.fi, type)) {
          const slug = getSlugForEntity(canonical, locale, type);
          const hub = resolveTaxonomyHub(byLocale[locale], slug, locale, type);
          if (!hub || hub.localized.toLowerCase() === canonical.toLowerCase()) {
            continue;
          }

          if (filterByFinnishName(byLocale[locale], type, canonical).length > 0) {
            continue;
          }

          if (hub.rows.length === 0) {
            failures.push(`${type}/${locale}: "${canonical}" /${slug}`);
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
