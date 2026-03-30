import { describe, it, expect, vi } from 'vitest';
import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';

const mockUniversities: University[] = [
  {
    id: 1,
    vari: 'Punainen',
    variLabel: 'Punainen',
    variBase: ['punainen'],
    hex: '#ff0000',
    alue: 'Helsinki',
    ala: 'fysiikka',
    ainejärjestö: 'Fyysikkokilta',
    oppilaitos: 'Helsingin yliopisto',
  },
  {
    id: 2,
    vari: 'Vihreä',
    variLabel: 'Vihreä',
    variBase: ['vihrea'],
    hex: '#00ff00',
    alue: 'Tampere',
    ala: 'insinööri',
    ainejärjestö: null,
    oppilaitos: 'Tampereen yliopisto',
  },
  {
    id: 3,
    vari: 'Sininen',
    variLabel: 'Sininen',
    variBase: ['sininen'],
    hex: '#0000ff',
    alue: 'Kuopio',
    ala: 'lääketiede',
    ainejärjestö: null,
    oppilaitos: 'Itä-Suomen yliopisto',
  },
];

vi.mock('./load-universities', () => ({
  loadUniversities: async () => mockUniversities,
}));

vi.mock('./load-color-data', () => ({
  loadColorData: async () => ({
    colors: {
      punainen: {
        main: ['Punainen'],
        shades: ['tummanpunainen'],
      },
      vihrea: {
        main: ['Vihreä'],
        shades: [],
      },
    },
  }),
}));

import { filterUniversities } from './deterministic-filter';

const baseQu: QueryUnderstanding = {
  isGibberish: false,
  filters: {
    color: undefined,
    area: undefined,
    field: undefined,
    school: undefined,
  },
  semanticQuery: '',
};

describe('filterUniversities', () => {
  it('returns an empty list when the query is marked as gibberish', async () => {
    const result = await filterUniversities(
      {
        ...baseQu,
        isGibberish: true,
      },
      'fi',
    );

    expect(result).toEqual([]);
  });

  it('filters by normalized color using color data variants', async () => {
    const result = await filterUniversities(
      {
        ...baseQu,
        filters: {
          ...baseQu.filters,
          color: 'punainen',
        },
      },
      'fi',
    );

    expect(result.map((u) => u.id)).toEqual([1]);
  });

  it('filters by area, field, and school case-insensitively', async () => {
    const result = await filterUniversities(
      {
        ...baseQu,
        filters: {
          color: undefined,
          area: 'helsinki',
          field: 'FYSIIKKA',
          school: 'helsingin yliopisto',
        },
      },
      'fi',
    );

    expect(result.map((u) => u.id)).toEqual([1]);
  });
});
