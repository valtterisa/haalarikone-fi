import { beforeAll, describe, expect, it } from 'vitest';
import { loadColorData } from '@/lib/load-color-data';
import { loadUniversities } from '@/lib/load-universities';
import {
  buildDeterministicQueryUnderstanding,
  buildSearchResponse,
} from '@/lib/build-search-response';
import { filterUniversities } from '@/lib/university-filters';
import type { ColorData } from '@/lib/load-color-data';
import type { University } from '@/types/university';

describe('advanced filters integration', () => {
  let universities: University[];
  let colorData: ColorData;

  beforeAll(async () => {
    universities = await loadUniversities('fi');
    colorData = await loadColorData();
  });

  it('filters by color only', () => {
    const results = filterUniversities(universities, { color: 'punainen' }, colorData);
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((uni) => uni.variBase?.some((base) => base.toLowerCase() === 'punainen')),
    ).toBe(true);
  });

  it('filters by area only', () => {
    const results = filterUniversities(universities, { area: 'Helsinki' }, colorData);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((uni) => uni.alue.toLowerCase().includes('helsinki'))).toBe(true);
  });

  it('filters by field only', () => {
    const results = filterUniversities(universities, { field: 'oikeustiede' }, colorData);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((uni) => (uni.ala || '').toLowerCase().includes('oikeustiede'))).toBe(
      true,
    );
  });

  it('filters by school only', () => {
    const results = filterUniversities(
      universities,
      { school: 'Helsingin yliopisto' },
      colorData,
    );
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((uni) => uni.oppilaitos.toLowerCase().includes('helsingin yliopisto')),
    ).toBe(true);
  });

  it('filters by color + area + school combination', () => {
    const results = filterUniversities(
      universities,
      {
        color: 'punainen',
        area: 'Helsinki',
        school: 'Helsingin yliopisto',
      },
      colorData,
    );
    expect(results.length).toBeGreaterThan(0);
    for (const uni of results) {
      expect(uni.variBase?.some((base) => base.toLowerCase() === 'punainen')).toBe(true);
      expect(uni.alue.toLowerCase().includes('helsinki')).toBe(true);
      expect(uni.oppilaitos.toLowerCase().includes('helsingin yliopisto')).toBe(true);
    }
  });

  it('returns empty for an impossible combination', () => {
    const results = filterUniversities(
      universities,
      {
        color: 'punainen',
        area: 'Helsinki',
        school: 'This School Does Not Exist XYZ',
      },
      colorData,
    );
    expect(results).toEqual([]);
  });

  it('applies advanced filters on top of text search results', () => {
    const query = 'Helsinki';
    const qu = buildDeterministicQueryUnderstanding(query, universities, colorData);
    const searchBody = buildSearchResponse(query, qu, universities, colorData);
    expect(searchBody.results.length).toBeGreaterThan(0);

    const filtered = filterUniversities(
      searchBody.results,
      { color: 'punainen' },
      colorData,
    );
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThanOrEqual(searchBody.results.length);
    for (const uni of filtered) {
      expect(uni.alue.toLowerCase().includes('helsinki')).toBe(true);
      expect(uni.variBase?.some((base) => base.toLowerCase() === 'punainen')).toBe(true);
    }
  });

  it('returns empty when text search results are wiped by filters', () => {
    const query = 'Helsinki';
    const qu = buildDeterministicQueryUnderstanding(query, universities, colorData);
    const searchBody = buildSearchResponse(query, qu, universities, colorData);
    expect(searchBody.results.length).toBeGreaterThan(0);

    const filtered = filterUniversities(
      searchBody.results,
      {
        color: 'punainen',
        school: 'This School Does Not Exist XYZ',
      },
      colorData,
    );
    expect(filtered).toEqual([]);
  });
});
