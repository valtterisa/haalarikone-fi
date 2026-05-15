import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import {
  buildDeterministicQueryUnderstanding,
  buildSearchResponse,
} from '@/lib/build-search-response';

export type SearchResponse = {
  results: University[];
  totalCount: number;
  filters?: {
    color?: string;
    area?: string;
    field?: string;
    school?: string;
    organization?: string;
  };
  semanticQuery?: string;
};

export type ClientSearchContext = {
  universities: University[];
  colorData: ColorData;
};

export type SearchOptions = {
  onSemanticEnrichment?: (results: University[]) => void;
  waitForSemanticEnrichment?: boolean;
};

export async function searchUniversitiesAPI(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  clientContext?: ClientSearchContext,
  options?: SearchOptions,
): Promise<University[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const trimmed = query.trim();
  if (clientContext) {
    const localResults = searchLocalHybrid(trimmed, clientContext);
    if (options?.waitForSemanticEnrichment) {
      const apiResults = await fetchApiResults(trimmed, locale);
      return mergePreferLocal(localResults, apiResults);
    }

    if (options?.onSemanticEnrichment) {
      void fetchApiResults(trimmed, locale).then((apiResults) => {
        const merged = mergePreferLocal(localResults, apiResults);
        if (merged.length > 0) {
          options.onSemanticEnrichment?.(merged);
        }
      });
    }

    return localResults;
  }

  return fetchApiResults(trimmed, locale);
}

function searchLocalHybrid(query: string, clientContext: ClientSearchContext): University[] {
  const { universities, colorData } = clientContext;
  const qu = buildDeterministicQueryUnderstanding(query, universities, colorData);
  return buildSearchResponse(query, qu, universities, colorData).results;
}

function mergePreferLocal(localResults: University[], apiResults: University[]): University[] {
  if (localResults.length === 0) return apiResults;
  if (apiResults.length === 0) return localResults;

  const mergedById = new Map<number, University>();
  for (const item of localResults) {
    mergedById.set(item.id, item);
  }
  for (const item of apiResults) {
    if (!mergedById.has(item.id)) {
      mergedById.set(item.id, item);
    }
  }
  return Array.from(mergedById.values());
}

async function fetchApiResults(query: string, locale: 'fi' | 'en' | 'sv'): Promise<University[]> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, locale }),
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as SearchResponse;
    return data.results || [];
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
}
