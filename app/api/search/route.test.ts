import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  const redisStub = {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue(undefined),
  };
  return {
    rateLimitAllowed: true,
    understandQueryMock: vi.fn(),
    loadUniversitiesMock: vi.fn(),
    loadColorDataMock: vi.fn(),
    limitMock: vi.fn(async () => ({ success: hoisted.rateLimitAllowed })),
    redisStub,
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => hoisted.redisStub),
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

vi.mock('@/lib/load-universities', () => ({
  loadUniversities: hoisted.loadUniversitiesMock,
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
    hoisted.loadUniversitiesMock.mockReset();
    hoisted.loadColorDataMock.mockReset();
    hoisted.redisStub.get.mockReset();
    hoisted.redisStub.get.mockResolvedValue(null);
    hoisted.redisStub.setex.mockReset();
    hoisted.redisStub.setex.mockResolvedValue(undefined);

    hoisted.understandQueryMock.mockResolvedValue({
      isGibberish: false,
      filters: {},
      semanticQuery: '',
    });
    hoisted.loadUniversitiesMock.mockResolvedValue([]);
    hoisted.loadColorDataMock.mockResolvedValue({ colors: {} });
  });

  it('falls back to fi locale when locale is invalid', async () => {
    hoisted.loadUniversitiesMock.mockResolvedValue([
      {
        id: 1,
        vari: 'Punainen',
        variLabel: 'Punainen',
        variBase: ['punainen'],
        hex: '#ff0000',
        alue: 'Helsinki',
        ala: 'fysiikka',
        ainejarjesto: 'Fyysikkokilta',
        slug: 'fyysikkokilta',
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

  it('returns cached body without calling understandQuery', async () => {
    const cached = {
      results: [],
      totalCount: 0,
      filters: {},
      semanticQuery: '',
    };
    hoisted.redisStub.get.mockResolvedValueOnce(cached);

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'cached-query', locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(cached);
    expect(hoisted.understandQueryMock).not.toHaveBeenCalled();
    expect(hoisted.redisStub.setex).not.toHaveBeenCalled();
  });

  it('enforces deterministic color filtering from query tokens', async () => {
    hoisted.understandQueryMock.mockResolvedValueOnce({
      isGibberish: false,
      filters: {},
      semanticQuery: 'jyväskylä',
    });
    hoisted.loadColorDataMock.mockResolvedValueOnce({
      colors: {
        keltainen: { main: ['keltainen'], shades: ['keltaiset'], color: '#ff0' },
      },
    });
    hoisted.loadUniversitiesMock.mockResolvedValueOnce([
      {
        id: 1,
        vari: 'Sininen',
        variLabel: 'Sininen',
        variBase: ['sininen'],
        hex: '#00f',
        alue: 'Jyväskylä',
        ala: 'muu',
        ainejarjesto: 'Siniset',
        slug: 'siniset',
        oppilaitos: 'Jyväskylän yliopisto',
      },
      {
        id: 2,
        vari: 'Keltainen',
        variLabel: 'Keltainen',
        variBase: ['keltainen'],
        hex: '#ff0',
        alue: 'Jyväskylä',
        ala: 'muu',
        ainejarjesto: 'Keltaiset',
        slug: 'keltaiset',
        oppilaitos: 'Jyväskylän yliopisto',
      },
    ]);

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'keltaiset haalarit jyväskylä', locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0]?.variBase).toContain('keltainen');
  });

  it('ranks matching area first within same color results', async () => {
    hoisted.understandQueryMock.mockResolvedValueOnce({
      isGibberish: false,
      filters: { color: 'keltainen', area: 'Jyväskylä' },
      semanticQuery: 'jyväskylä',
    });
    hoisted.loadColorDataMock.mockResolvedValueOnce({
      colors: {
        keltainen: { main: ['keltainen'], shades: ['keltaiset'], color: '#ff0' },
      },
    });
    hoisted.loadUniversitiesMock.mockResolvedValueOnce([
      {
        id: 10,
        vari: 'Keltainen',
        variLabel: 'Keltainen',
        variBase: ['keltainen'],
        hex: '#ff0',
        alue: 'Turku',
        ala: 'insinööri',
        ainejarjesto: 'Turun Keltaiset',
        slug: 'turun-keltaiset',
        oppilaitos: 'Turun yliopisto',
      },
      {
        id: 11,
        vari: 'Keltainen',
        variLabel: 'Keltainen',
        variBase: ['keltainen'],
        hex: '#ff0',
        alue: 'Jyväskylä',
        ala: 'insinööri',
        ainejarjesto: 'Jyväs Keltaiset',
        slug: 'jyvas-keltaiset',
        oppilaitos: 'Jyväskylän yliopisto',
      },
    ]);

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'keltaiset haalarit jyväskylä', locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results[0]?.alue).toBe('Jyväskylä');
  });
});
