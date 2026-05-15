import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { University } from '@/types/university';
import { searchUniversitiesAPI } from './search-utils';

const fetchMock = vi.fn();

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
});

describe('searchUniversitiesAPI', () => {
  const colorData = {
    colors: {
      keltainen: {
        color: '#ff0',
        main: ['keltainen'],
        shades: ['keltaiset'],
      },
      vihreä: {
        color: '#0f0',
        main: ['vihreä'],
        shades: [],
      },
    },
  };

  const universities: University[] = [
    {
      id: 1,
      vari: 'Keltainen',
      hex: '#ff0',
      variBase: ['keltainen'],
      alue: 'Rauma',
      ala: 'luokanopettaja',
      ainejarjesto: 'Lokilta',
      variLabel: 'Keltainen',
      slug: 'lokilta',
      oppilaitos: 'Turun yliopisto',
    },
    {
      id: 2,
      vari: 'Vihreä',
      hex: '#14780a',
      variBase: ['vihreä'],
      alue: 'Tampere',
      ala: 'environmental engineering',
      ainejarjesto: 'GLOBE',
      variLabel: 'Vihreä',
      slug: 'globe',
      oppilaitos: 'Tampereen AMK',
    },
    {
      id: 3,
      vari: 'Vihreä',
      hex: '#2cab1a',
      variBase: ['vihreä'],
      alue: 'Tampere',
      ala: 'textile and material engineering',
      ainejarjesto: 'GLOBE',
      variLabel: 'Vihreä',
      slug: 'globe-tema',
      oppilaitos: 'Tampereen AMK',
    },
  ];

  it('returns an empty array and does not call the API for short queries', async () => {
    const result = await searchUniversitiesAPI('ab', 'fi');

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves simple color queries locally without calling the API', async () => {
    const result = await searchUniversitiesAPI('keltainen', 'fi', {
      universities,
      colorData,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.map((item) => item.id)).toEqual([1]);
  });

  it('uses client-side fuzzy for typoed organization queries', async () => {
    const result = await searchUniversitiesAPI('glboe', 'fi', {
      universities,
      colorData,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.map((item) => item.id)).toEqual([2, 3]);
  });

  it('returns all color matches without top-k truncation', async () => {
    const manyYellow: University[] = Array.from({ length: 160 }).map((_, idx) => ({
      id: idx + 10,
      vari: 'Keltainen',
      hex: '#ff0',
      variBase: ['keltainen'],
      alue: 'Turku',
      ala: `ala-${idx}`,
      ainejarjesto: `jarjesto-${idx}`,
      variLabel: 'Keltainen',
      slug: `jarjesto-${idx}`,
      oppilaitos: 'Turun yliopisto',
    }));

    const result = await searchUniversitiesAPI('keltaiset haalarit', 'fi', {
      universities: manyYellow,
      colorData,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toHaveLength(160);
  });

  it('returns local results immediately and enriches with API results asynchronously', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [universities[2]],
        totalCount: 1,
      }),
    });
    const onSemanticEnrichment = vi.fn();

    const result = await searchUniversitiesAPI(
      'globe',
      'fi',
      { universities, colorData },
      {
        onSemanticEnrichment,
      },
    );

    expect(result.map((item) => item.id)).toEqual([2, 3]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSemanticEnrichment).toHaveBeenCalled();
  });

  it('can wait for semantic enrichment before returning results', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [universities[2]],
        totalCount: 1,
      }),
    });

    const result = await searchUniversitiesAPI(
      'globe',
      'fi',
      { universities, colorData },
      { waitForSemanticEnrichment: true },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.map((item) => item.id)).toEqual([2, 3]);
  });

  it('prefers semantic ordering when waiting for enrichment', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [universities[0]],
        totalCount: 1,
      }),
    });

    const result = await searchUniversitiesAPI(
      'keltaiset haalarit jyväskylä',
      'fi',
      { universities, colorData },
      { waitForSemanticEnrichment: true },
    );

    expect(result.map((item) => item.id)).toEqual([1]);
  });

  it('keeps exact local matches ahead of semantic-only matches when waiting for enrichment', async () => {
    const localUniversities: University[] = [
      {
        id: 20,
        vari: 'Musta',
        hex: '#000',
        variBase: ['black'],
        alue: 'Espoo',
        ala: 'tietojenkäsittely',
        ainejarjesto: 'Serveri',
        variLabel: 'Musta',
        slug: 'serveri',
        oppilaitos: 'XAMK',
      },
      {
        id: 21,
        vari: 'Musta',
        hex: '#000',
        variBase: ['black'],
        alue: 'Espoo',
        ala: 'serverit ja infra',
        ainejarjesto: 'Muu',
        variLabel: 'Musta',
        slug: 'muu',
        oppilaitos: 'Serveri Instituutti',
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [localUniversities[1]],
        totalCount: 1,
      }),
    });

    const result = await searchUniversitiesAPI(
      'serveri',
      'fi',
      { universities: localUniversities, colorData },
      { waitForSemanticEnrichment: true },
    );

    expect(result[0]?.ainejarjesto).toBe('Serveri');
  });

  it('prioritizes an exact organization match to the top', async () => {
    const result = await searchUniversitiesAPI('GLOBE', 'fi', {
      universities: [
        {
          id: 4,
          vari: 'Vihreä',
          hex: '#14780a',
          variBase: ['vihreä'],
          alue: 'Tampere',
          ala: 'muu',
          ainejarjesto: 'GLOBE',
          variLabel: 'Vihreä',
          slug: 'globe',
          oppilaitos: 'A-koulu',
        },
        {
          id: 5,
          vari: 'Vihreä',
          hex: '#14780a',
          variBase: ['vihreä'],
          alue: 'Tampere',
          ala: 'muu',
          ainejarjesto: 'GLOBE-like',
          variLabel: 'Vihreä',
          slug: 'globe-like',
          oppilaitos: 'A-koulu',
        },
      ],
      colorData,
    });

    expect(result[0]?.ainejarjesto).toBe('GLOBE');
  });

  it('prioritizes exact organization over school/field contains matches', async () => {
    const result = await searchUniversitiesAPI('serveri', 'fi', {
      universities: [
        {
          id: 10,
          vari: 'Musta',
          hex: '#000',
          variBase: ['black'],
          alue: 'Espoo',
          ala: 'palvelin ja serveri infra',
          ainejarjesto: 'Muu',
          variLabel: 'Musta',
          slug: 'muu',
          oppilaitos: 'Serveri instituutti',
        },
        {
          id: 11,
          vari: 'Musta',
          hex: '#000',
          variBase: ['black'],
          alue: 'Espoo',
          ala: 'tietojenkäsittely',
          ainejarjesto: 'Serveri',
          variLabel: 'Musta',
          slug: 'serveri',
          oppilaitos: 'XAMK',
        },
      ],
      colorData,
    });

    expect(result[0]?.ainejarjesto).toBe('Serveri');
  });

  it('prioritizes matching area within color-filtered queries', async () => {
    const result = await searchUniversitiesAPI('keltaiset haalarit jyväskylä', 'fi', {
      universities: [
        {
          id: 30,
          vari: 'Keltainen',
          hex: '#ff0',
          variBase: ['keltainen'],
          alue: 'Turku',
          ala: 'insinööri',
          ainejarjesto: 'Turun Keltaiset',
          variLabel: 'Keltainen',
          slug: 'turun-keltaiset',
          oppilaitos: 'Turun yliopisto',
        },
        {
          id: 31,
          vari: 'Keltainen',
          hex: '#ff0',
          variBase: ['keltainen'],
          alue: 'Jyväskylä',
          ala: 'insinööri',
          ainejarjesto: 'Jyväs Keltaiset',
          variLabel: 'Keltainen',
          slug: 'jyvas-keltaiset',
          oppilaitos: 'Jyväskylän yliopisto',
        },
      ],
      colorData,
    });

    expect(result[0]?.alue).toBe('Jyväskylä');
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
    expect(result).toEqual(universities);
  });

  it('returns an empty array when the API responds with a non-ok status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const result = await searchUniversitiesAPI('Helsinki', 'fi');

    expect(result).toEqual([]);
  });

  it('returns an empty array when the API call throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const result = await searchUniversitiesAPI('Helsinki', 'fi');

    expect(result).toEqual([]);
  });
});
