import { describe, expect, it } from 'vitest';
import { mergeOverallForPublic, type OrganizationProfileRow } from '@/lib/org-profile';
import type { EnrichedOrganization } from '@/lib/load-enrichment';
import type { University } from '@/types/university';

const overall: University = {
  id: 1,
  ainejarjesto: 'Test ry',
  oppilaitos: 'Testi AMK',
  ala: 'testiala',
  alue: 'Helsinki',
  vari: 'vihreä',
  variLabel: 'vihreä',
  variBase: ['vihreä'],
  hex: 'background: #65a30d; color: white;',
  slug: 'test-ry',
};

const enrichment: EnrichedOrganization = {
  name: 'Test ry',
  slug: 'test-ry',
  schools: ['Testi AMK'],
  fields: ['testiala'],
  areas: ['Helsinki'],
  website: 'https://test-ry.fi',
  description: 'Vanha kuvaus',
  source: 'enrichment',
};

function profile(partial: Partial<OrganizationProfileRow> = {}): OrganizationProfileRow {
  return {
    orgSlug: 'test-ry',
    overallId: 1,
    displayName: 'Claimed Test ry',
    website: 'https://claimed.test-ry.fi',
    descriptionFi: 'Suomenkielinen kuvaus',
    descriptionEn: 'English description',
    descriptionSv: 'Svensk beskrivning',
    instagramUrl: null,
    discordUrl: null,
    variLabel: 'lime',
    variBaseJson: '["vihreä","keltainen"]',
    hex: '#aabbcc',
    textColor: 'black',
    claimedByUserId: 'user-1',
    verifiedAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    updatedByUserId: 'user-1',
    ...partial,
  };
}

describe('mergeOverallForPublic', () => {
  it('returns unverified original data without a profile', () => {
    const result = mergeOverallForPublic(overall, enrichment, null, 'fi');
    expect(result.verified).toBe(false);
    expect(result.overall).toBe(overall);
    expect(result.enrichment).toBe(enrichment);
  });

  it('overlays claimed profile fields and marks verified', () => {
    const result = mergeOverallForPublic(overall, enrichment, profile(), 'fi');
    expect(result.verified).toBe(true);
    expect(result.overall.ainejarjesto).toBe('Claimed Test ry');
    expect(result.overall.variLabel).toBe('lime');
    expect(result.overall.variBase).toEqual(['vihreä', 'keltainen']);
    expect(result.overall.hex).toBe('background: #aabbcc; color: black;');
    expect(result.enrichment?.website).toBe('https://claimed.test-ry.fi');
    expect(result.enrichment?.description).toBe('Suomenkielinen kuvaus');
  });

  it('picks locale-specific description with fallbacks', () => {
    expect(
      mergeOverallForPublic(overall, enrichment, profile(), 'en').enrichment?.description,
    ).toBe('English description');
    expect(
      mergeOverallForPublic(
        overall,
        enrichment,
        profile({ descriptionEn: null, descriptionSv: null }),
        'en',
      ).enrichment?.description,
    ).toBe('Suomenkielinen kuvaus');
  });

  it('builds enrichment from profile when enrichment is missing', () => {
    const result = mergeOverallForPublic(overall, null, profile(), 'fi');
    expect(result.enrichment).toMatchObject({
      name: 'Claimed Test ry',
      slug: 'test-ry',
      website: 'https://claimed.test-ry.fi',
      source: 'claimed',
    });
  });

  it('ignores invalid variBaseJson', () => {
    const result = mergeOverallForPublic(
      overall,
      enrichment,
      profile({ variBaseJson: '{not-json' }),
      'fi',
    );
    expect(result.overall.variBase).toEqual(['vihreä']);
  });
});
