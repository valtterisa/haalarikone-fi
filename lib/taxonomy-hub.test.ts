import { describe, expect, it } from 'vitest';
import { loadUniversities } from '@/lib/load-universities';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';
import { getTaxonomyEntities, resolveTaxonomyHub, type TaxonomyType } from '@/lib/taxonomy-hub';

const LOCALES: Locale[] = ['fi', 'en', 'sv'];
const TYPES: TaxonomyType[] = ['university', 'field', 'color', 'area'];

describe('taxonomy hub pages', () => {
  for (const type of TYPES) {
    for (const locale of LOCALES) {
      it(`every ${type} hub page has results in ${locale}`, async () => {
        // generateStaticParams() derives the slug set from the Finnish rows.
        const canonicalEntities = getTaxonomyEntities(await loadUniversities('fi'), type);
        expect(canonicalEntities.length).toBeGreaterThan(0);

        const rows = await loadUniversities(locale);
        const empty: string[] = [];

        for (const canonical of canonicalEntities) {
          const slug = getSlugForEntity(canonical, locale, type);
          const hub = resolveTaxonomyHub(rows, slug, locale, type);
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

  it('resolves a localized slug back to the canonical Finnish entity', async () => {
    const rows = await loadUniversities('en');
    const hub = resolveTaxonomyHub(rows, 'university-of-turku', 'en', 'university');

    expect(hub?.canonical).toBe('Turun yliopisto');
    expect(hub?.localized).toBe('University of Turku');
    expect(hub?.rows.length).toBeGreaterThan(0);
    expect(hub?.rows.every((u) => u.oppilaitos === 'University of Turku')).toBe(true);
  });

  it('matches colors by canonical base across locales', async () => {
    const fi = resolveTaxonomyHub(await loadUniversities('fi'), 'vihrea', 'fi', 'color');
    const en = resolveTaxonomyHub(await loadUniversities('en'), 'green', 'en', 'color');
    const sv = resolveTaxonomyHub(await loadUniversities('sv'), 'gron', 'sv', 'color');

    expect(fi?.rows.length).toBeGreaterThan(0);
    expect(en?.rows.length).toBe(fi?.rows.length);
    expect(sv?.rows.length).toBe(fi?.rows.length);
  });

  it('returns null for an unknown slug', async () => {
    const rows = await loadUniversities('en');
    expect(resolveTaxonomyHub(rows, 'not-a-real-university', 'en', 'university')).toBeNull();
  });
});
