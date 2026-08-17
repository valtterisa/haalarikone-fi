import { describe, expect, it } from 'vitest';
import { entitySlug } from './entity-slug';
import { generateSlug } from './generate-slug';
import { getLocalizedName } from './get-finnish-name';
import { getEntityFromSlug, getSlugForEntity } from './slug-translations';

describe('university slug translations', () => {
  it('uses the English Tampere University slug for Tampereen yliopisto', () => {
    const englishName = getLocalizedName('Tampereen yliopisto', 'en', 'university');
    expect(getSlugForEntity('Tampereen yliopisto', 'en', 'university')).toBe(
      generateSlug(englishName),
    );
    expect(getSlugForEntity('Tampereen yliopisto', 'en', 'university')).toBe('tampere-university');
  });

  it('uses the Swedish Tammerfors universitet slug for Tampereen yliopisto', () => {
    const swedishName = getLocalizedName('Tampereen yliopisto', 'sv', 'university');
    expect(getSlugForEntity('Tampereen yliopisto', 'sv', 'university')).toBe(
      generateSlug(swedishName),
    );
    expect(getSlugForEntity('Tampereen yliopisto', 'sv', 'university')).toBe(
      'tammerfors-universitet',
    );
  });

  it('makes entitySlug match getSlugForEntity for Finnish Tampereen yliopisto', () => {
    const englishSlug = getSlugForEntity('Tampereen yliopisto', 'en', 'university');
    expect(entitySlug('Tampereen yliopisto', 'en', 'university')).toBe(englishSlug);
    expect(englishSlug).toBe('tampere-university');
  });

  it('resolves the English slug back to Tampereen yliopisto', () => {
    const englishSlug = getSlugForEntity('Tampereen yliopisto', 'en', 'university');
    expect(getEntityFromSlug(englishSlug, 'en', 'university', ['Tampereen yliopisto'])).toBe(
      'Tampereen yliopisto',
    );
  });

  it('resolves the Swedish slug back to Tampereen yliopisto', () => {
    const swedishSlug = getSlugForEntity('Tampereen yliopisto', 'sv', 'university');
    expect(getEntityFromSlug(swedishSlug, 'sv', 'university', ['Tampereen yliopisto'])).toBe(
      'Tampereen yliopisto',
    );
  });

  it('round-trips an AMK that was missing from the old hardcoded map', () => {
    const englishSlug = getSlugForEntity('Tampereen AMK', 'en', 'university');
    expect(englishSlug).toBe('tampere-university-of-applied-sciences');
    expect(getEntityFromSlug(englishSlug, 'en', 'university', ['Tampereen AMK'])).toBe(
      'Tampereen AMK',
    );
  });
});
