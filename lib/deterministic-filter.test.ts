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
  {
    id: 100,
    vari: 'Hopeanharmaa',
    variLabel: 'Hopeanharmaa',
    variBase: ['harmaa'],
    hex: '#c0c0c0',
    alue: 'Joensuu',
    ala: 'tietojenkäsittelytiede',
    ainejärjestö: 'Skripti',
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
    organization: undefined,
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
          organization: undefined,
        },
      },
      'fi',
    );

    expect(result.map((u) => u.id)).toEqual([1]);
  });

  it('filters by student organization (ainejärjestö) case-insensitively', async () => {
    const result = await filterUniversities(
      {
        ...baseQu,
        filters: {
          ...baseQu.filters,
          organization: 'fyysikko',
        },
      },
      'fi',
    );

    expect(result.map((u) => u.id)).toEqual([1]);
  });

  it('returns no matches when organization filter does not match any row', async () => {
    const result = await filterUniversities(
      {
        ...baseQu,
        filters: {
          ...baseQu.filters,
          organization: 'Indecs',
        },
      },
      'fi',
    );

    expect(result.map((u) => u.id)).toEqual([]);
  });

  it('drops a bogus field filter when organization matches but field would exclude all rows', async () => {
    const result = await filterUniversities(
      {
        ...baseQu,
        filters: {
          ...baseQu.filters,
          field: 'skri',
          organization: 'Skripti',
        },
      },
      'fi',
    );

    expect(result.map((u) => u.id)).toEqual([100]);
  });
});
