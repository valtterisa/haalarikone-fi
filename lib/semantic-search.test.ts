import { describe, it, expect, vi } from 'vitest';
import type { University } from '@/types/university';

const { mockUniversities } = vi.hoisted(() => {
  const list: University[] = [
    {
      id: 1,
      vari: 'punainen',
      variLabel: 'punainen',
      variBase: ['punainen'],
      hex: '#ff0000',
      alue: 'Helsinki',
      ala: 'fysiikka',
      ainejarjesto: 'Fyysikkokilta',
      slug: 'fyysikkokilta',
      oppilaitos: 'Helsingin yliopisto',
    },
    {
      id: 2,
      vari: 'sininen',
      variLabel: 'sininen',
      variBase: ['sininen'],
      hex: '#0000ff',
      alue: 'Tampere',
      ala: 'tietotekniikka',
      ainejarjesto: null,
      slug: 'u-2',
      oppilaitos: 'Tampereen yliopisto',
    },
    {
      id: 3,
      vari: 'vihreä',
      variLabel: 'vihreä',
      variBase: ['vihrea'],
      hex: '#00ff00',
      alue: 'Oulu',
      ala: null,
      ainejarjesto: null,
      slug: 'u-3',
      oppilaitos: 'Oulun yliopisto',
    },
    {
      id: 4,
      vari: 'harmaa',
      variLabel: 'harmaa',
      variBase: ['harmaa'],
      hex: '#ccc',
      alue: 'Joensuu',
      ala: 'tietojenkäsittelytiede',
      ainejarjesto: 'Skripti',
      slug: 'skripti',
      oppilaitos: 'Itä-Suomen yliopisto',
    },
  ];
  return { mockUniversities: list };
});

vi.mock('./load-universities', () => ({
  loadUniversities: vi.fn().mockResolvedValue(mockUniversities),
}));

import { semanticSearch } from './semantic-search';

describe('semanticSearch', () => {
  it('returns an empty array for an empty query', async () => {
    const result = await semanticSearch('', 'fi', 10);
    expect(result).toEqual([]);
  });

  it('returns an empty array for a whitespace-only query', async () => {
    const result = await semanticSearch('   ', 'fi', 10);
    expect(result).toEqual([]);
  });

  it('returns scored and sorted results based on keyword matching', async () => {
    const result = await semanticSearch('Helsinki fysiikka', 'fi', 10);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe(1);
  });

  it('scores ala matches highest', async () => {
    const result = await semanticSearch('tietotekniikka', 'fi', 10);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  it('respects the limit parameter', async () => {
    const result = await semanticSearch('yliopisto', 'fi', 2);

    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('returns all scored results when limit is Infinity', async () => {
    const result = await semanticSearch('yliopisto', 'fi', Number.POSITIVE_INFINITY);

    expect(result.length).toBe(4);
  });

  it('returns empty array when no universities match', async () => {
    const result = await semanticSearch('zzznomatch', 'fi', 10);
    expect(result).toEqual([]);
  });

  it('uses organization from filter context as an extra scoring token', async () => {
    const result = await semanticSearch('xx', 'fi', 10, { organization: 'Skripti' });

    expect(result.some((u) => u.id === 4)).toBe(true);
  });
});
