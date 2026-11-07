import { beforeAll, describe, expect, it } from 'vitest';
import { buildOrganizationOgPayload, findOrganizationBySlug } from '@/lib/og/build-organization-og';
import { buildUniversityOgPayload } from '@/lib/og/build-university-og';
import { loadUniversities } from '@/lib/load-universities';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';
import { resolveTaxonomyHub } from '@/lib/taxonomy-hub';
import type { University } from '@/types/university';

const byLocale: Record<Locale, University[]> = { fi: [], en: [], sv: [] };

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

describe('organization OG payload', () => {
  it('builds a payload for LOK ry with the forest-green swatch', () => {
    const overall = findOrganizationBySlug(byLocale.fi, 'lok-ry');
    expect(overall).toBeTruthy();
    const payload = buildOrganizationOgPayload(overall!, 'fi');

    expect(payload.kind).toBe('organization');
    expect(payload.title).toBe('LOK ry');
    expect(payload.university).toBe('Hämeen AMK');
    expect(payload.colorLabel).toBe('Metsänvihreä');
    expect(payload.colorHex).toBe('#14780A');
    expect(payload.textOnColor).toBe('#FFFFFF');
    expect(payload.eyebrow).toBe('Opiskelijajärjestö');
    expect(payload.brand).toBe('Haalarikone');
  });

  it('localizes the unknown-organization fallback', () => {
    const overall = findOrganizationBySlug(byLocale.fi, 'lok-ry')!;
    const withoutOrg: University = { ...overall, ainejarjesto: null };
    expect(buildOrganizationOgPayload(withoutOrg, 'en').title).toBe('Unknown organization');
    expect(buildOrganizationOgPayload(withoutOrg, 'sv').title).toBe('Okänd organisation');
  });

  it('returns undefined for an unknown slug', () => {
    expect(findOrganizationBySlug(byLocale.fi, 'does-not-exist')).toBeUndefined();
  });
});

describe('university OG payload', () => {
  it('builds a palette strip for Hämeen AMK', () => {
    const slug = getSlugForEntity('Hämeen AMK', 'fi', 'university');
    const hub = resolveTaxonomyHub(byLocale.fi, slug, 'fi', 'university');
    expect(hub).toBeTruthy();

    const payload = buildUniversityOgPayload(hub!.localized, hub!.rows, 'fi');
    expect(payload.kind).toBe('university');
    expect(payload.title).toBe('Hämeen AMK');
    expect(payload.overallCount).toBe(hub!.rows.length);
    expect(payload.overallCountLabel).toMatch(/haalari/);
    expect(payload.swatches.length).toBeGreaterThan(1);
    expect(payload.swatches.every((hex) => /^#[0-9A-F]{6}$/.test(hex))).toBe(true);
    expect(payload.eyebrow).toBe('Oppilaitos');
  });

  it('localizes count labels for English hubs', () => {
    const fiSlug = getSlugForEntity('Hämeen AMK', 'fi', 'university');
    const fiHub = resolveTaxonomyHub(byLocale.fi, fiSlug, 'fi', 'university')!;
    const enSlug = getSlugForEntity(fiHub.canonical, 'en', 'university');
    const enHub = resolveTaxonomyHub(byLocale.en, enSlug, 'en', 'university');
    expect(enHub).toBeTruthy();

    const payload = buildUniversityOgPayload(enHub!.localized, enHub!.rows, 'en');
    expect(payload.overallCountLabel).toMatch(/overall/);
    expect(payload.colorCountLabel).toMatch(/color/);
    expect(payload.eyebrow).toBe('Institution');
  });
});
