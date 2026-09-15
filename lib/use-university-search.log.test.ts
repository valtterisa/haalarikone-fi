/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColorData } from '@/lib/load-color-data';
import type { University } from '@/types/university';
import { clearSearchLog } from '@/lib/log-search-query';

const hoisted = vi.hoisted(() => ({
  searchUniversitiesAPIMock: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'fi',
}));

vi.mock('@/lib/analytics-events', () => ({
  trackSearchApply: vi.fn(),
}));

vi.mock('@/lib/search-utils', () => ({
  searchUniversitiesAPI: (...args: unknown[]) => hoisted.searchUniversitiesAPIMock(...args),
}));

import { useUniversitySearch } from '@/lib/use-university-search';

const universities: University[] = [
  {
    id: 1,
    vari: 'punainen',
    variLabel: 'punainen',
    variBase: ['punainen'],
    hex: '#f00',
    alue: 'Helsinki',
    ala: 'tekniikka',
    ainejarjesto: 'Testi',
    slug: 'testi',
    oppilaitos: 'Aalto-yliopisto',
  },
  {
    id: 2,
    vari: 'musta',
    variLabel: 'musta',
    variBase: ['musta'],
    hex: '#000',
    alue: 'Tampere',
    ala: 'kauppatieteet',
    ainejarjesto: 'Toinen',
    slug: 'toinen',
    oppilaitos: 'Tampereen yliopisto',
  },
];

const colorData: ColorData = {
  colors: {
    punainen: { color: '#f00', main: ['punainen'], shades: [] },
    musta: { color: '#000', main: ['musta'], shades: [] },
  },
};

describe('useUniversitySearch search logging', () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

  beforeEach(() => {
    clearSearchLog();
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    hoisted.searchUniversitiesAPIMock.mockReset();
    hoisted.searchUniversitiesAPIMock.mockResolvedValue([universities[0]]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    clearSearchLog();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function lastBody() {
    const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  }

  async function settleTextSearch(
    result: { current: ReturnType<typeof useUniversitySearch> },
    query: string,
  ) {
    await act(async () => {
      result.current.handleTextSearchChange(query);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });
  }

  it('stages on settled text search and POSTs only after blur', async () => {
    const { result } = renderHook(() =>
      useUniversitySearch({
        initialUniversities: universities,
        colorData,
      }),
    );

    await settleTextSearch(result, 'helsinki');

    expect(hoisted.searchUniversitiesAPIMock).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleSearchBlur();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/log-search');
    expect(lastBody()).toMatchObject({
      query: 'helsinki',
      locale: 'fi',
      source: 'listing',
      resultCount: 1,
    });
  });

  it('stages resultCount from search results, not the full initial list', async () => {
    const { result } = renderHook(() =>
      useUniversitySearch({
        initialUniversities: universities,
        colorData,
        showResultsByDefault: true,
      }),
    );

    expect(result.current.results).toHaveLength(2);

    await settleTextSearch(result, 'helsinki');

    await act(async () => {
      result.current.handleSearchBlur();
    });

    expect(lastBody().resultCount).toBe(1);
  });

  it('apply updates staged filters and blur sends once', async () => {
    const { result } = renderHook(() =>
      useUniversitySearch({
        initialUniversities: universities,
        colorData,
      }),
    );

    await settleTextSearch(result, 'helsinki');
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleDraftAdvancedFilterChange({
        color: 'punainen',
        area: '',
        field: '',
        school: '',
      });
    });
    await act(async () => {
      result.current.handleApplyAdvancedFilters();
    });

    expect(fetchMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    await act(async () => {
      result.current.handleSearchBlur();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody()).toMatchObject({
      query: 'helsinki',
      color: 'punainen',
      source: 'listing',
      resultCount: 1,
    });
  });

  it('does not POST while typing before debounce', async () => {
    const { result } = renderHook(() =>
      useUniversitySearch({
        initialUniversities: universities,
        colorData,
      }),
    );

    await act(async () => {
      result.current.handleTextSearchChange('hel');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(hoisted.searchUniversitiesAPIMock).not.toHaveBeenCalled();
  });
});
