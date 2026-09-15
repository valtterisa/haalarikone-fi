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

export type SearchLogMeta = {
  source: 'modal' | 'listing';
  color?: string | null;
  area?: string | null;
  field?: string | null;
  school?: string | null;
};

export type SearchOptions = {
  onSemanticEnrichment?: (results: University[]) => void;
  waitForSemanticEnrichment?: boolean;
  log?: SearchLogMeta;
};

function hasLogFilters(log?: SearchLogMeta) {
  return Boolean(log?.color || log?.area || log?.field || log?.school);
}

export async function searchUniversitiesAPI(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  clientContext?: ClientSearchContext,
  options?: SearchOptions,
): Promise<University[]> {
  const trimmed = query.trim();
  const hasText = trimmed.length >= 3;

  if (!hasText) {
    if (!hasLogFilters(options?.log)) return [];
    return fetchApiResults('', locale, options?.log);
  }

  if (clientContext) {
    const localResults = searchLocalHybrid(trimmed, clientContext);
    if (options?.waitForSemanticEnrichment) {
      const apiResults = await fetchApiResults(trimmed, locale, options.log);
      const merged = mergePreferLocal(localResults, apiResults);
      if (merged.length > 0) {
        options.onSemanticEnrichment?.(merged);
      }
      return merged;
    }

    void fetchApiResults(trimmed, locale, options?.log).then((apiResults) => {
      if (!options?.onSemanticEnrichment) return;
      const merged = mergePreferLocal(localResults, apiResults);
      if (merged.length > 0) {
        options.onSemanticEnrichment(merged);
      }
    });

    return localResults;
  }

  return fetchApiResults(trimmed, locale, options?.log);
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

async function fetchApiResults(
  query: string,
  locale: 'fi' | 'en' | 'sv',
  log?: SearchLogMeta,
): Promise<University[]> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        locale,
        source: log?.source ?? 'listing',
        color: log?.color ?? null,
        area: log?.area ?? null,
        field: log?.field ?? null,
        school: log?.school ?? null,
      }),
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
