/** @vitest-environment jsdom */

import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const searchUniversitiesAPIMock = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'fi',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/use-translated-routes', () => ({
  useTranslatedRoutes: () => ({
    overall: (slug: string) => `/haalari/${slug}`,
    colors: (slug: string) => `/vari/${slug}`,
    universities: (slug: string) => `/oppilaitos/${slug}`,
  }),
}));

vi.mock('@/lib/search-utils', () => ({
  searchUniversitiesAPI: (...args: unknown[]) => searchUniversitiesAPIMock(...args),
}));

import { SearchModalRoot, useSearchModal } from '@/components/search-modal';
import type { ClientSearchContext } from '@/lib/search-utils';

const DEBOUNCE_MS = 1000;

type ModalApi = ReturnType<typeof useSearchModal>;

function renderModal(clientSearchContext?: ClientSearchContext) {
  const api: { current: ModalApi | null } = { current: null };
  function Probe() {
    api.current = useSearchModal();
    return null;
  }
  const ui = (context?: ClientSearchContext) => (
    <SearchModalRoot placeholder="search" modalTitle="title" clientSearchContext={context}>
      <Probe />
    </SearchModalRoot>
  );
  const { rerender } = render(ui(clientSearchContext));
  return { api, rerenderWith: (context?: ClientSearchContext) => rerender(ui(context)) };
}

async function settle() {
  await act(async () => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('SearchModal search triggers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchUniversitiesAPIMock.mockReset();
    searchUniversitiesAPIMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends one request per settled query with source modal', async () => {
    const { api } = renderModal();

    for (const value of ['Hel', 'Helai', 'Helainki']) {
      act(() => {
        api.current!.setSearchQuery(value);
      });
    }
    await settle();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);
    expect(searchUniversitiesAPIMock.mock.calls[0]?.[0]).toBe('Helainki');
    expect(searchUniversitiesAPIMock.mock.calls[0]?.[3]?.log?.source).toBe('modal');
  });

  it('does not resend the settled query when the parent passes a new search context object', async () => {
    const context = (): ClientSearchContext => ({
      universities: [],
      colorData: { colors: {} },
    });
    const { api, rerenderWith } = renderModal(context());

    act(() => {
      api.current!.setSearchQuery('Helainki');
    });
    await settle();
    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);

    rerenderWith(context());
    rerenderWith(context());
    await settle();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(1);
  });

  it('sends a new request for a different settled query', async () => {
    const { api } = renderModal();

    act(() => {
      api.current!.setSearchQuery('Helainki');
    });
    await settle();
    act(() => {
      api.current!.setSearchQuery('Tampere');
    });
    await settle();

    expect(searchUniversitiesAPIMock).toHaveBeenCalledTimes(2);
    expect(searchUniversitiesAPIMock.mock.calls[1]?.[0]).toBe('Tampere');
  });
});
