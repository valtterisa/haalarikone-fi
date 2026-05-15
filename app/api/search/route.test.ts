import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  const redisStub = {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue(undefined),
  };

  return {
    rateLimitAllowed: true,
    understandQueryWithAIMock: vi.fn(),
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
  understandQueryWithAI: hoisted.understandQueryWithAIMock,
}));

vi.mock('@/lib/load-universities', () => ({
  loadUniversities: hoisted.loadUniversitiesMock,
}));

vi.mock('@/lib/load-color-data', () => ({
  loadColorData: hoisted.loadColorDataMock,
}));

import { POST } from './route';

const SEARCH_COLOR_DATA = {
  colors: {
    valkoinen: { main: ['valkoinen'], shades: [], color: '#fff' },
    musta: { main: ['musta'], shades: [], color: '#000' },
    punainen: { main: ['punainen'], shades: [], color: '#f00' },
    sininen: { main: ['sininen'], shades: [], color: '#00f' },
    vihreä: { main: ['vihreä'], shades: [], color: '#0f0' },
    keltainen: { main: ['keltainen'], shades: [], color: '#ff0' },
    oranssi: { main: ['oranssi'], shades: [], color: '#fa0' },
    violetti: { main: ['violetti'], shades: [], color: '#70f' },
    pinkki: { main: ['pinkki'], shades: [], color: '#f8c' },
    harmaa: { main: ['harmaa'], shades: [], color: '#999' },
    ruskea: { main: ['ruskea'], shades: [], color: '#741' },
    turkoosi: { main: ['turkoosi'], shades: [], color: '#0cc' },
  },
};

const SEARCH_UNIVERSITIES = [
  {
    id: 1,
    vari: 'Valkoinen',
    variLabel: 'Valkoinen',
    variBase: ['valkoinen'],
    hex: '#fff',
    alue: 'Helsinki',
    ala: 'oikeustiede',
    ainejarjesto: 'Valkoiset Lex',
    slug: 'valkoiset-lex',
    oppilaitos: 'Helsingin yliopisto',
  },
  {
    id: 2,
    vari: 'Musta',
    variLabel: 'Musta',
    variBase: ['musta'],
    hex: '#000',
    alue: 'Espoo',
    ala: 'tietojenkäsittelytiede',
    ainejarjesto: 'Mustat Data',
    slug: 'mustat-data',
    oppilaitos: 'Aalto-yliopisto',
  },
  {
    id: 3,
    vari: 'Punainen',
    variLabel: 'Punainen',
    variBase: ['punainen'],
    hex: '#f00',
    alue: 'Turku',
    ala: 'lääketiede',
    ainejarjesto: 'Punaiset Med',
    slug: 'punaiset-med',
    oppilaitos: 'Turun yliopisto',
  },
  {
    id: 4,
    vari: 'Sininen',
    variLabel: 'Sininen',
    variBase: ['sininen'],
    hex: '#00f',
    alue: 'Oulu',
    ala: 'biologia',
    ainejarjesto: 'Siniset Bio',
    slug: 'siniset-bio',
    oppilaitos: 'Oulun yliopisto',
  },
  {
    id: 5,
    vari: 'Vihreä',
    variLabel: 'Vihreä',
    variBase: ['vihreä'],
    hex: '#0f0',
    alue: 'Tampere',
    ala: 'ympäristötiede',
    ainejarjesto: 'Vihreät ry',
    slug: 'vihreat-ry',
    oppilaitos: 'Tampereen yliopisto',
  },
  {
    id: 6,
    vari: 'Keltainen',
    variLabel: 'Keltainen',
    variBase: ['keltainen'],
    hex: '#ff0',
    alue: 'Jyväskylä',
    ala: 'kemia',
    ainejarjesto: 'Keltaiset Kemia',
    slug: 'keltaiset-kemia',
    oppilaitos: 'Jyväskylän yliopisto',
  },
  {
    id: 7,
    vari: 'Oranssi',
    variLabel: 'Oranssi',
    variBase: ['oranssi'],
    hex: '#fa0',
    alue: 'Kuopio',
    ala: 'historia',
    ainejarjesto: 'Oranssit Historia',
    slug: 'oranssit-historia',
    oppilaitos: 'Itä-Suomen yliopisto',
  },
  {
    id: 8,
    vari: 'Violetti',
    variLabel: 'Violetti',
    variBase: ['violetti'],
    hex: '#70f',
    alue: 'Joensuu',
    ala: 'matematiikka',
    ainejarjesto: 'Violetit Matikka',
    slug: 'violetit-matikka',
    oppilaitos: 'Itä-Suomen yliopisto',
  },
  {
    id: 9,
    vari: 'Pinkki',
    variLabel: 'Pinkki',
    variBase: ['pinkki'],
    hex: '#f8c',
    alue: 'Vaasa',
    ala: 'kielitiede',
    ainejarjesto: 'Pinkit Kieli',
    slug: 'pinkit-kieli',
    oppilaitos: 'Vaasan yliopisto',
  },
  {
    id: 10,
    vari: 'Harmaa',
    variLabel: 'Harmaa',
    variBase: ['harmaa'],
    hex: '#999',
    alue: 'Lappeenranta',
    ala: 'psykologia',
    ainejarjesto: 'Harmaat Psyk',
    slug: 'harmaat-psyk',
    oppilaitos: 'LUT-yliopisto',
  },
  {
    id: 11,
    vari: 'Ruskea',
    variLabel: 'Ruskea',
    variBase: ['ruskea'],
    hex: '#741',
    alue: 'Rovaniemi',
    ala: 'filosofia',
    ainejarjesto: 'Ruskeat Filosofia',
    slug: 'ruskeat-filosofia',
    oppilaitos: 'Lapin yliopisto',
  },
  {
    id: 12,
    vari: 'Turkoosi',
    variLabel: 'Turkoosi',
    variBase: ['turkoosi'],
    hex: '#0cc',
    alue: 'Lahti',
    ala: 'fysiikka',
    ainejarjesto: 'Turkoosit Fysiikka',
    slug: 'turkoosit-fysiikka',
    oppilaitos: 'LAB-ammattikorkeakoulu',
  },
];

describe('/api/search route', () => {
  beforeEach(() => {
    hoisted.rateLimitAllowed = true;
    hoisted.limitMock.mockClear();
    hoisted.understandQueryWithAIMock.mockReset();
    hoisted.loadUniversitiesMock.mockReset();
    hoisted.loadColorDataMock.mockReset();
    hoisted.redisStub.get.mockReset();
    hoisted.redisStub.get.mockResolvedValue(null);
    hoisted.redisStub.setex.mockReset();
    hoisted.redisStub.setex.mockResolvedValue(undefined);

    hoisted.understandQueryWithAIMock.mockResolvedValue({
      isGibberish: false,
      filters: {},
      semanticQuery: '',
    });
  });

  async function runSearch(query: string) {
    hoisted.loadColorDataMock.mockResolvedValueOnce(SEARCH_COLOR_DATA);
    hoisted.loadUniversitiesMock.mockResolvedValueOnce(SEARCH_UNIVERSITIES);

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();
    return { res, body };
  }

  const queryCases: Array<{ query: string; expectedIds: number[] }> = [
    { query: 'valkoiset', expectedIds: [1] },
    { query: 'mustat', expectedIds: [2] },
    { query: 'punaiset', expectedIds: [3] },
    { query: 'siniset', expectedIds: [4] },
    { query: 'vihreat', expectedIds: [5] },
    { query: 'keltaiset', expectedIds: [6] },
    { query: 'oranssit', expectedIds: [7] },
    { query: 'violetit', expectedIds: [8] },
    { query: 'pinkit', expectedIds: [9] },
    { query: 'harmaat', expectedIds: [10] },
    { query: 'ruskeat', expectedIds: [11] },
    { query: 'turkoosit', expectedIds: [12] },
    { query: 'vihreat tampere', expectedIds: [5] },
    { query: 'keltaiset jyvaskyla', expectedIds: [6] },
    { query: 'punaiset turku', expectedIds: [3] },
    { query: 'siniset oulu', expectedIds: [4] },
    { query: 'mustat espoo', expectedIds: [2] },
    { query: 'turkoosit lahti', expectedIds: [12] },
    { query: 'oranssit kuopio', expectedIds: [7] },
    { query: 'matematiikka joensuu', expectedIds: [8] },
    { query: 'psykologia lappeenranta', expectedIds: [10] },
    { query: 'filosofia rovaniemi', expectedIds: [11] },
    { query: 'fysiikka lahti', expectedIds: [12] },
    { query: 'oikeustiede helsinki', expectedIds: [1] },
  ];

  it.each(queryCases)(
    'returns expected search end result for "$query"',
    async ({ query, expectedIds }) => {
      const { res, body } = await runSearch(query);

      expect(res.status).toBe(200);
      expect(body.results.map((u: { id: number }) => u.id)).toEqual(expectedIds);
      expect(hoisted.understandQueryWithAIMock).not.toHaveBeenCalled();
    },
  );

  it('calls AI fallback only when deterministic result is empty', async () => {
    hoisted.loadColorDataMock.mockResolvedValueOnce({ colors: {} });
    hoisted.loadUniversitiesMock.mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'satunnainen hakulause', locale: 'fi' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(hoisted.understandQueryWithAIMock).toHaveBeenCalledTimes(1);
  });

  it('returns deterministic empty response when AI fallback throws', async () => {
    hoisted.loadColorDataMock.mockResolvedValueOnce({ colors: {} });
    hoisted.loadUniversitiesMock.mockResolvedValueOnce([]);
    hoisted.understandQueryWithAIMock.mockRejectedValueOnce(new Error('AI offline'));

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'satunnainen hakulause', locale: 'fi' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.totalCount).toBe(0);
    expect(hoisted.understandQueryWithAIMock).toHaveBeenCalledTimes(1);
  });
});
