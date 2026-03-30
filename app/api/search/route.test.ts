import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  return {
    rateLimitAllowed: true,
    understandQueryMock: vi.fn(),
    filterUniversitiesMock: vi.fn(),
    semanticSearchMock: vi.fn(),
    loadColorDataMock: vi.fn(),
    limitMock: vi.fn(async () => ({ success: hoisted.rateLimitAllowed })),
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn();
    limit = hoisted.limitMock;
    constructor() {}
  },
}));

vi.mock('@/lib/query-understanding', () => ({
  understandQuery: hoisted.understandQueryMock,
}));

vi.mock('@/lib/deterministic-filter', () => ({
  filterUniversities: hoisted.filterUniversitiesMock,
}));

vi.mock('@/lib/semantic-search', () => ({
  semanticSearch: hoisted.semanticSearchMock,
}));

vi.mock('@/lib/load-color-data', () => ({
  loadColorData: hoisted.loadColorDataMock,
}));

import { POST } from './route';

describe('/api/search route', () => {
  beforeEach(() => {
    hoisted.rateLimitAllowed = true;
    hoisted.limitMock.mockClear();
    hoisted.understandQueryMock.mockReset();
    hoisted.filterUniversitiesMock.mockReset();
    hoisted.semanticSearchMock.mockReset();
    hoisted.loadColorDataMock.mockReset();

    hoisted.understandQueryMock.mockResolvedValue({
      isGibberish: false,
      filters: {},
      semanticQuery: '',
    });
    hoisted.filterUniversitiesMock.mockResolvedValue([]);
    hoisted.semanticSearchMock.mockResolvedValue([]);
    hoisted.loadColorDataMock.mockResolvedValue({ colors: {} });
  });

  it('falls back to fi locale when locale is invalid', async () => {
    hoisted.filterUniversitiesMock.mockResolvedValue([
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
    ]);

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'helsinki', locale: 'de' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(hoisted.understandQueryMock).toHaveBeenCalledWith('helsinki', 'fi');
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBe(1);
  });

  it('rejects oversized queries', async () => {
    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'a'.repeat(201), locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Query too long' });
    expect(hoisted.understandQueryMock).not.toHaveBeenCalled();
  });

  it('handles malformed json body safely', async () => {
    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ results: [], totalCount: 0 });
    expect(hoisted.understandQueryMock).not.toHaveBeenCalled();
  });

  it('returns consistent rate-limit response shape', async () => {
    hoisted.rateLimitAllowed = false;

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'helsinki', locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ success: false, error: 'Unable to process at this time' });
    expect(hoisted.understandQueryMock).not.toHaveBeenCalled();
  });
});
