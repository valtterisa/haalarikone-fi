import { describe, it, expect, vi } from 'vitest';
import type { QueryUnderstanding } from './query-understanding';

vi.mock('@upstash/redis', () => {
  const store = new Map<string, QueryUnderstanding>();

  return {
    Redis: {
      fromEnv: () => ({
        get: async (key: string) => store.get(key),
        setex: async (key: string, _ttl: number, value: QueryUnderstanding) => {
          store.set(key, value);
        },
      }),
    },
  };
});

vi.mock('./load-color-data', () => ({
  loadColorData: async () => ({
    colors: {
      vihrea: {
        main: ['vihreä'],
        shades: ['tummanvihreä'],
      },
    },
  }),
}));

vi.mock('./load-universities', () => ({
  loadUniversities: async () => [
    {
      id: 1,
      vari: 'Sininen',
      variLabel: 'Sininen',
      variBase: ['sininen'],
      hex: '#00f',
      alue: 'Kuopio',
      ala: 'tietojenkäsittelytiede',
      ainejarjesto: 'Testi ry',
      slug: 'testi-ry',
      oppilaitos: 'Itä-Suomen yliopisto',
    },
    {
      id: 2,
      vari: 'Punainen',
      variLabel: 'Punainen',
      variBase: ['punainen'],
      hex: '#f00',
      alue: 'Tampere',
      ala: 'insinööri',
      ainejarjesto: 'Insinöörit',
      slug: 'insinoorit',
      oppilaitos: 'Tampereen yliopisto',
    },
  ],
}));

vi.mock('ai', () => ({
  generateText: async (options: { prompt?: string }) => {
    const prompt = String(options.prompt ?? '');

    if (prompt.includes('asdf')) {
      return {
        output: {
          isGibberish: true,
          filters: {
            color: undefined,
            area: undefined,
            field: undefined,
            school: undefined,
            organization: undefined,
          },
          semanticQuery: '',
        },
      };
    }

    return {
      output: {
        isGibberish: false,
        filters: {
          color: undefined,
          area: 'Tampere',
          field: 'insinööri',
          school: undefined,
          organization: undefined,
        },
        semanticQuery: 'insinööri Tampere',
      },
    };
  },
  Output: {
    object: (input: unknown) => input,
  },
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: () => 'anthropic-mocked-model',
}));

import { understandQuery, understandQueryWithAI } from './query-understanding';

describe('understandQuery', () => {
  it('extracts a color filter from simple color queries without treating them as gibberish', async () => {
    const result = await understandQuery('  vihreä  ', 'fi');

    expect(result.isGibberish).toBe(false);
    expect(result.filters.color).toBe('vihreä');
    expect(result.filters.area).toBeUndefined();
    expect(result.filters.field).toBeUndefined();
    expect(result.filters.school).toBeUndefined();
    expect(result.filters.organization).toBeUndefined();
  });

  it('uses deterministic fallback for complex queries by default', async () => {
    const result = await understandQuery('insinöörit Tampereella', 'fi');

    expect(result.isGibberish).toBe(false);
    expect(result.filters.area).toBe('Tampere');
    expect(result.filters.field).toBe('insinööri');
    expect(result.semanticQuery).toBe('insinöörit Tampereella');
  });

  it('extracts known field and area deterministically from query terms', async () => {
    const result = await understandQuery('tietojenkäsittelytiede kuopio', 'fi');

    expect(result.isGibberish).toBe(false);
    expect(result.filters.area).toBe('Kuopio');
    expect(result.filters.field).toBe('tietojenkäsittelytiede');
  });

  it('uses AI fallback parser when explicitly requested', async () => {
    const result = await understandQueryWithAI('insinöörit Tampereella', 'fi');

    expect(result.isGibberish).toBe(false);
    expect(result.filters.area).toBe('Tampere');
    expect(result.filters.field).toBe('insinööri');
    expect(result.semanticQuery).toBe('insinööri Tampere');
  });

  it('marks clearly meaningless queries as gibberish in AI fallback parser', async () => {
    const result = await understandQueryWithAI('asdf qwer zxcv', 'fi');

    expect(result.isGibberish).toBe(true);
    expect(result.filters.color).toBeUndefined();
    expect(result.filters.area).toBeUndefined();
    expect(result.filters.field).toBeUndefined();
    expect(result.filters.school).toBeUndefined();
    expect(result.filters.organization).toBeUndefined();
    expect(result.semanticQuery).toBe('');
  });
});
