import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  understandQueryWithAIMock: vi.fn(),
  loadUniversitiesMock: vi.fn(),
}));

vi.mock('@/lib/query-understanding', () => ({
  understandQueryWithAI: hoisted.understandQueryWithAIMock,
}));

vi.mock('@/lib/load-universities', async () => {
  const actual = await vi.importActual<typeof import('@/lib/load-universities')>(
    '@/lib/load-universities',
  );
  return {
    ...actual,
    loadUniversities: (...args: Parameters<typeof actual.loadUniversities>) =>
      hoisted.loadUniversitiesMock(...args),
  };
});

import { POST } from './route';
import type { University } from '@/types/university';

describe('search API integration', () => {
  let realUniversities: University[];
  let realLoadUniversities: typeof import('@/lib/load-universities').loadUniversities;

  beforeAll(async () => {
    const actual = await vi.importActual<typeof import('@/lib/load-universities')>(
      '@/lib/load-universities',
    );
    realLoadUniversities = actual.loadUniversities;
    realUniversities = await realLoadUniversities('fi');
  });

  beforeEach(() => {
    hoisted.understandQueryWithAIMock.mockReset();
    hoisted.loadUniversitiesMock.mockReset();
    hoisted.understandQueryWithAIMock.mockResolvedValue({
      isGibberish: false,
      filters: {},
      semanticQuery: '',
    });
    hoisted.loadUniversitiesMock.mockImplementation(async (locale: 'fi' | 'en' | 'sv') => {
      if (locale === 'fi') return realUniversities;
      return realLoadUniversities(locale);
    });
  });

  async function runSearch(query: string, locale: 'fi' | 'en' | 'sv' = 'fi') {
    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, locale }),
    });
    const res = await POST(req);
    const body = await res.json();
    return { res, body };
  }

  it('returns Helsinki area results for a city query', async () => {
    const { res, body } = await runSearch('Helsinki');
    expect(res.status).toBe(200);
    expect(body.results.length).toBeGreaterThan(0);
    expect(
      body.results.every((uni: { alue: string }) => uni.alue.toLowerCase().includes('helsinki')),
    ).toBe(true);
    expect(hoisted.understandQueryWithAIMock).not.toHaveBeenCalled();
  });

  it('returns color matches for a color word without calling AI', async () => {
    const { res, body } = await runSearch('punaiset');
    expect(res.status).toBe(200);
    expect(body.results.length).toBeGreaterThan(0);
    expect(
      body.results.every((uni: { variBase?: string[] }) =>
        (uni.variBase ?? []).some((base) => base.toLowerCase() === 'punainen'),
      ),
    ).toBe(true);
    expect(hoisted.understandQueryWithAIMock).not.toHaveBeenCalled();
  });

  it('returns school matches for Helsingin yliopisto', async () => {
    const { res, body } = await runSearch('Helsingin yliopisto');
    expect(res.status).toBe(200);
    expect(body.results.length).toBeGreaterThan(0);
    expect(
      body.results.some((uni: { oppilaitos: string }) =>
        uni.oppilaitos.toLowerCase().includes('helsingin yliopisto'),
      ),
    ).toBe(true);
    expect(hoisted.understandQueryWithAIMock).not.toHaveBeenCalled();
  });

  it('handles multi-token color + city queries', async () => {
    const { res, body } = await runSearch('punaiset helsinki');
    expect(res.status).toBe(200);
    expect(body.results.length).toBeGreaterThan(0);
    for (const uni of body.results as Array<{ alue: string; variBase?: string[] }>) {
      expect(uni.alue.toLowerCase().includes('helsinki')).toBe(true);
      expect((uni.variBase ?? []).some((base) => base.toLowerCase() === 'punainen')).toBe(true);
    }
    expect(hoisted.understandQueryWithAIMock).not.toHaveBeenCalled();
  });

  it('calls AI fallback only when deterministic result is empty', async () => {
    hoisted.loadUniversitiesMock.mockResolvedValueOnce([]);
    const { res } = await runSearch('xyzzyplughqqq');
    expect(res.status).toBe(200);
    expect(hoisted.understandQueryWithAIMock).toHaveBeenCalledTimes(1);
  });

  it('returns empty results when AI fallback throws', async () => {
    hoisted.loadUniversitiesMock.mockResolvedValueOnce([]);
    hoisted.understandQueryWithAIMock.mockRejectedValueOnce(new Error('AI offline'));
    const { res, body } = await runSearch('xyzzyplughqqq');
    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.totalCount).toBe(0);
    expect(hoisted.understandQueryWithAIMock).toHaveBeenCalledTimes(1);
  });
});
