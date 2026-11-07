import { beforeAll, describe, expect, it } from 'vitest';
import { findOrganizationBySlug } from '@/lib/og/build-organization-og';
import { buildOrganizationSeoMeta } from '@/lib/organization-seo-meta';
import { loadUniversities } from '@/lib/load-universities';
import type { University } from '@/types/university';

describe('buildOrganizationSeoMeta', () => {
  let universities: University[];

  beforeAll(async () => {
    universities = await loadUniversities('fi');
  });

  it('leads with the student organization name and still includes the color', () => {
    const overall = findOrganizationBySlug(universities, 'lok-ry');
    expect(overall).toBeTruthy();

    const meta = buildOrganizationSeoMeta(overall!, 'fi');
    expect(meta.openGraphTitle).toBe('LOK ry (metsänvihreä) - Hämeen AMK');
    expect(meta.documentTitle).toBe('LOK ry (metsänvihreä) - Hämeen AMK | Haalarikone');
    expect(meta.openGraphTitle.startsWith(overall!.vari)).toBe(false);
    expect(meta.openGraphTitle).toContain(`(${overall!.vari})`);
    expect(meta.fallbackDescription.startsWith('LOK ry:')).toBe(true);
    expect(meta.fallbackDescription).toContain(overall!.vari);
  });

  it('fixes the Vostok share title that previously led with oranssi', () => {
    const overall = findOrganizationBySlug(universities, 'vostok');
    expect(overall).toBeTruthy();
    const meta = buildOrganizationSeoMeta(overall!, 'fi');

    expect(meta.openGraphTitle).toBe('Vostok (oranssi) - Tampereen yliopisto');
    expect(meta.documentTitle).toBe('Vostok (oranssi) - Tampereen yliopisto | Haalarikone');
    expect(meta.fallbackDescription).toBe(
      'Vostok: oranssi haalari, Tampereen yliopisto – journalistiikka',
    );
  });

  it('localizes titles and descriptions for English and Swedish', async () => {
    const [enRows, svRows] = await Promise.all([loadUniversities('en'), loadUniversities('sv')]);
    const en = findOrganizationBySlug(enRows, 'vostok')!;
    const sv = findOrganizationBySlug(svRows, 'vostok')!;

    const enMeta = buildOrganizationSeoMeta(en, 'en');
    const svMeta = buildOrganizationSeoMeta(sv, 'sv');

    expect(enMeta.openGraphTitle).toBe('Vostok (orange) - Tampere University');
    expect(enMeta.fallbackDescription).toContain('orange overall');
    expect(svMeta.openGraphTitle).toContain('Tammerfors universitet');
    expect(svMeta.fallbackDescription).toContain('orange overall');
  });

  it('falls back to university + color when organization is missing', () => {
    const overall = findOrganizationBySlug(universities, 'lok-ry')!;
    const withoutOrg: University = { ...overall, ainejarjesto: null };
    const meta = buildOrganizationSeoMeta(withoutOrg, 'fi');

    expect(meta.openGraphTitle).toBe(`${overall.oppilaitos} (${overall.vari})`);
    expect(meta.documentTitle).toBe(`${overall.oppilaitos} (${overall.vari}) | Haalarikone`);
    expect(meta.primaryName).toBe('Tuntematon järjestö');
  });

  it('localizes the unknown-organization primary name', () => {
    const overall = findOrganizationBySlug(universities, 'lok-ry')!;
    const withoutOrg: University = { ...overall, ainejarjesto: '   ' };
    expect(buildOrganizationSeoMeta(withoutOrg, 'en').primaryName).toBe('Unknown organization');
  });
});
