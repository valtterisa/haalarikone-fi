/** @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColorData } from '@/lib/load-color-data';
import type { University } from '@/types/university';

const searchUniversitiesAPIMock = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'fi',
}));

vi.mock('@/lib/search-utils', () => ({
  searchUniversitiesAPI: (...args: unknown[]) => searchUniversitiesAPIMock(...args),
}));

vi.mock('@/lib/analytics-events', () => ({
  trackSearchApply: vi.fn(),
}));

import { useUniversitySearch } from '@/lib/use-university-search';

const DEBOUNCE_MS = 1000;

const universities: University[] = [
  {
    id: 1,
    vari: 'punainen',
    variLabel: 'Punainen',
    variBase: ['punainen'],
    hex: '#ff0000',
    alue: 'Helsinki',
    ainejarjesto: 'Testi',
    slug: 'testi',
    oppilaitos: 'HY',
  },
  {
    id: 2,
    vari: 'sininen',
    variLabel: 'Sininen',
    variBase: ['sininen'],
    hex: '#0000ff',
    alue: 'Tampere',
    ainejarjesto: 'Testi2',
    slug: 'testi-2',
    oppilaitos: 'TAU',
  },
  {
    id: 3,
    vari: 'punainen',
    variLabel: 'Punainen',
    variBase: ['punainen'],
    hex: '#ff0000',
    alue: 'Turku',
    ainejarjesto: 'Testi3',
    slug: 'testi-3',
    oppilaitos: 'UTU',
  },
];

const colorData: ColorData = {
  colors: {
    punainen: { color: '#ff0000', main: ['punainen'], shades: [] },
    sininen: { color: '#0000ff', main: ['sininen'], shades: [] },
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function flushDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
  await flushMicrotasks();
}

function renderSearch() {
  return renderHook(() => useUniversitySearch({ initialUniversities: universities, colorData }));
}

describe('useUniversitySearch search triggers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchUniversitiesAPIMock.mockReset();
    searchUniversitiesAPIMock.mockResolvedValue(universities);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls search API once per settled query, not on keystrokes typed after a settled prefix', async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.handleTextSearchChange('Hel');
    });
    await flushDebounce();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);
    expect(searchUniversitiesAPIMock.mock.calls[0]?.[0]).toBe('Hel');

    for (const value of ['Hela', 'Helai', 'Helain', 'Helaink', 'Helainki']) {
      act(() => {
        result.current.handleTextSearchChange(value);
      });
    }

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);

    await flushDebounce();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(2);
    expect(searchUniversitiesAPIMock.mock.calls[1]?.[0]).toBe('Helainki');
  });

  it('calls search API again with the filter when filters change for the same text', async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();
    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDraftAdvancedFilterChange({
        color: 'punainen',
        area: '',
        field: '',
        school: '',
      });
    });
    act(() => {
      result.current.handleApplyAdvancedFilters();
    });
    await flushMicrotasks();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(2);
    expect(searchUniversitiesAPIMock.mock.calls[1]?.[3]?.log?.color).toBe('punainen');
  });

  it('updates draft filter result count when a filter is removed from draft', async () => {
    searchUniversitiesAPIMock.mockResolvedValue(
      universities.filter((uni) => uni.variBase?.includes('punainen')),
    );
    const { result } = renderSearch();

    act(() => {
      result.current.handleDraftAdvancedFilterChange({
        color: 'punainen',
        area: '',
        field: '',
        school: '',
      });
    });
    expect(result.current.draftFilterResultCount).toBe(2);

    act(() => {
      result.current.handleApplyAdvancedFilters();
    });
    await flushMicrotasks();

    expect(result.current.results).toHaveLength(2);
    expect(result.current.draftFilterResultCount).toBe(2);

    act(() => {
      result.current.handleDraftAdvancedFilterChange({
        color: '',
        area: '',
        field: '',
        school: '',
      });
    });

    expect(result.current.draftFilterResultCount).toBe(universities.length);
  });

  it('allows the same query again after clearing', async () => {
    const { result } = renderSearch();

    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();
    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleClearAll();
    });
    await flushMicrotasks();

    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(2);
  });

  it('applies the in-flight result when the user types and reverts to the settled query', async () => {
    const freshUni: University = { ...universities[0]!, id: 42, slug: 'fresh' };
    const pending = deferred<University[]>();
    searchUniversitiesAPIMock.mockReturnValueOnce(pending.promise);
    const { result } = renderSearch();

    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();
    expect(result.current.isSearching).toBe(true);

    act(() => {
      result.current.handleTextSearchChange('Helainkix');
    });
    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();

    await act(async () => {
      pending.resolve([freshUni]);
      await pending.promise;
    });

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.results.map((uni) => uni.id)).toEqual([42]);
  });

  it('drops an in-flight result when the query is cleared before it resolves', async () => {
    const staleUni: University = { ...universities[0]!, id: 99, slug: 'stale' };
    const pending = deferred<University[]>();
    searchUniversitiesAPIMock.mockReturnValueOnce(pending.promise);
    const { result } = renderSearch();

    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();
    expect(result.current.isSearching).toBe(true);

    act(() => {
      result.current.handleClearAll();
    });
    await flushMicrotasks();

    await act(async () => {
      pending.resolve([staleUni]);
      await pending.promise;
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.results.map((uni) => uni.id)).not.toContain(99);
  });

  it('drops a slower earlier result when a newer settled query resolves first', async () => {
    const staleUni: University = { ...universities[0]!, id: 99, slug: 'stale' };
    const slow = deferred<University[]>();
    searchUniversitiesAPIMock.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(universities);
    const { result } = renderSearch();

    act(() => {
      result.current.handleTextSearchChange('Helainki');
    });
    await flushDebounce();

    act(() => {
      result.current.handleTextSearchChange('Tampere');
    });
    await flushDebounce();

    await act(async () => {
      slow.resolve([staleUni]);
      await slow.promise;
    });

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(2);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.results.map((uni) => uni.id)).toEqual([1, 2, 3]);
  });
});
