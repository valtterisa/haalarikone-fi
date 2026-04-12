import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { University } from '@/types/university';
import { searchUniversitiesAPI } from './search-utils';

const fetchMock = vi.fn();

beforeEach(() => {
  // @ts-expect-error - assign mocked fetch for tests
  global.fetch = fetchMock;
  fetchMock.mockReset();
});

describe('searchUniversitiesAPI', () => {
  it('returns an empty array and does not call the API for short queries', async () => {
    const result = await searchUniversitiesAPI('ab', 'fi');

    expect(result).toEqual({ ok: true, results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves simple color queries locally without calling the API', async () => {
    const universities: University[] = [
      {
        id: 1,
        vari: 'Punainen',
        hex: '#ff0000',
        variBase: ['punainen'],
        alue: 'Helsinki',
        ala: 'fysiikka',
        ainejarjesto: 'Fyysikkokilta',
        variLabel: 'Punainen',
        slug: 'fyysikkokilta',
        oppilaitos: 'Helsingin yliopisto',
      },
    ];
    const colorData = {
      colors: {
        punainen: {
          color: '#ff0000',
          main: ['punainen'],
          shades: [],
        },
      },
    };

    const result = await searchUniversitiesAPI('punainen', 'fi', {
      universities,
      colorData,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, results: universities });
  });

  it('returns results when the API responds successfully', async () => {
    const universities: University[] = [
      {
        id: 1,
        vari: 'Punainen',
        hex: '#ff0000',
        alue: 'Helsinki',
        ala: 'fysiikka',
        ainejarjesto: 'Fyysikkokilta',
        variLabel: 'Punainen',
        variBase: ['punainen'],
        slug: 'fyysikkokilta',
        oppilaitos: 'Helsingin yliopisto',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: universities,
        totalCount: universities.length,
      }),
    });

    const result = await searchUniversitiesAPI('Helsinki', 'fi');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/search');
    expect(result).toEqual({ ok: true, results: universities });
  });

  it('returns request_failed when the API responds with a non-ok status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const result = await searchUniversitiesAPI('Helsinki', 'fi');

    expect(result).toEqual({ ok: false, error: 'request_failed' });
  });

  it('returns request_failed when the API call throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const result = await searchUniversitiesAPI('Helsinki', 'fi');

    expect(result).toEqual({ ok: false, error: 'request_failed' });
  });
});
