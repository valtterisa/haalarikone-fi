import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UpstashSearchResult } from './semantic-search';

const searchMock = vi.fn<() => Promise<UpstashSearchResult[] | unknown>>();

vi.mock('@upstash/search', () => ({
  Search: class {
    constructor(_config: { url: string; token: string }) {}

    index(_name: string) {
      return {
        search: searchMock,
      };
    }
  },
}));

import { semanticSearch } from './semantic-search';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  searchMock.mockReset();
});

describe('semanticSearch', () => {
  it('returns an empty array when Upstash env vars are missing', async () => {
    delete process.env.UPSTASH_SEARCH_REST_URL;
    delete process.env.UPSTASH_SEARCH_REST_TOKEN;

    const result = await semanticSearch('test', 'fi', 10);

    expect(result).toEqual([]);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('calls Upstash search with trimmed query and maps results to universities', async () => {
    process.env.UPSTASH_SEARCH_REST_URL = 'https://example.com';
    process.env.UPSTASH_SEARCH_REST_TOKEN = 'token';

    const upstashResults: UpstashSearchResult[] = [
      {
        id: '1',
        content: {
          vari: { fi: 'Punainen', en: 'Red' },
          alue: 'Helsinki',
          ala: { fi: 'fysiikka' },
          ainejärjestö: 'Fyysikkokilta',
          oppilaitos: { fi: 'Helsingin yliopisto' },
        },
        metadata: {
          hex: '#ff0000',
        },
        score: 0.9,
      },
    ];

    searchMock.mockResolvedValueOnce(upstashResults);

    const result = await semanticSearch('  Helsinki  ', 'fi', 5);

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith({
      query: 'Helsinki',
      reranking: true,
      limit: 5,
    });

    expect(result).toEqual([
      {
        id: 1,
        vari: 'Punainen',
        hex: '#ff0000',
        alue: 'Helsinki',
        ala: 'fysiikka',
        ainejärjestö: 'Fyysikkokilta',
        oppilaitos: 'Helsingin yliopisto',
      },
    ]);
  });

  it('returns an empty array when Upstash search returns an invalid payload', async () => {
    process.env.UPSTASH_SEARCH_REST_URL = 'https://example.com';
    process.env.UPSTASH_SEARCH_REST_TOKEN = 'token';

    searchMock.mockResolvedValueOnce(null as unknown);

    const result = await semanticSearch('query', 'fi', 10);

    expect(result).toEqual([]);
  });
});
