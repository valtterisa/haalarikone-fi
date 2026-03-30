import { beforeEach, describe, expect, it, vi } from 'vitest';

let rateLimitAllowed = true;

const understandQueryMock = vi.fn();
const filterUniversitiesMock = vi.fn();
const semanticSearchMock = vi.fn();
const loadColorDataMock = vi.fn();
const limitMock = vi.fn(async () => ({ success: rateLimitAllowed }));

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn();
    limit = limitMock;
    constructor() {}
  },
}));

vi.mock('@/lib/query-understanding', () => ({
  understandQuery: understandQueryMock,
}));

vi.mock('@/lib/deterministic-filter', () => ({
  filterUniversities: filterUniversitiesMock,
}));

vi.mock('@/lib/semantic-search', () => ({
  semanticSearch: semanticSearchMock,
}));

vi.mock('@/lib/load-color-data', () => ({
  loadColorData: loadColorDataMock,
}));

import { POST } from './route';

describe('/api/search route', () => {
  beforeEach(() => {
    rateLimitAllowed = true;
    limitMock.mockClear();
    understandQueryMock.mockReset();
    filterUniversitiesMock.mockReset();
    semanticSearchMock.mockReset();
    loadColorDataMock.mockReset();

    understandQueryMock.mockResolvedValue({
      isGibberish: false,
      filters: {},
      semanticQuery: '',
    });
    filterUniversitiesMock.mockResolvedValue([]);
    semanticSearchMock.mockResolvedValue([]);
    loadColorDataMock.mockResolvedValue({ colors: {} });
  });

  it('falls back to fi locale when locale is invalid', async () => {
    filterUniversitiesMock.mockResolvedValue([
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
    expect(understandQueryMock).toHaveBeenCalledWith('helsinki', 'fi');
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
    expect(understandQueryMock).not.toHaveBeenCalled();
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
    expect(understandQueryMock).not.toHaveBeenCalled();
  });

  it('returns consistent rate-limit response shape', async () => {
    rateLimitAllowed = false;

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'helsinki', locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ success: false, error: 'Unable to process at this time' });
    expect(understandQueryMock).not.toHaveBeenCalled();
  });
});
