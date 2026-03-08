import { describe, it, expect, vi } from 'vitest';
import type { University } from '@/types/university';

const mockUniversities: University[] = [
  {
    id: 1,
    vari: 'punainen',
    hex: '#ff0000',
    alue: 'Helsinki',
    ala: 'fysiikka',
    ainejärjestö: 'Fyysikkokilta',
    oppilaitos: 'Helsingin yliopisto',
  },
  {
    id: 2,
    vari: 'sininen',
    hex: '#0000ff',
    alue: 'Tampere',
    ala: 'tietotekniikka',
    ainejärjestö: null,
    oppilaitos: 'Tampereen yliopisto',
  },
  {
    id: 3,
    vari: 'vihreä',
    hex: '#00ff00',
    alue: 'Oulu',
    ala: null,
    ainejärjestö: null,
    oppilaitos: 'Oulun yliopisto',
  },
];

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

  it('returns empty array when no universities match', async () => {
    const result = await semanticSearch('zzznomatch', 'fi', 10);
    expect(result).toEqual([]);
  });
});
