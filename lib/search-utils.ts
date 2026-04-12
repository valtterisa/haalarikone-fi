import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import { parseSimpleQueryWithColorData } from '@/lib/parse-simple-query';
import { buildSearchResponse } from '@/lib/build-search-response';

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

export type SearchUniversitiesAPIResult =
  | { ok: true; results: University[] }
  | { ok: false; error: 'request_failed' };

export async function searchUniversitiesAPI(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  clientContext?: ClientSearchContext,
): Promise<SearchUniversitiesAPIResult> {
  if (!query || query.trim().length < 3) {
    return { ok: true, results: [] };
  }

  const trimmed = query.trim();
  if (clientContext) {
    const simple = parseSimpleQueryWithColorData(trimmed, clientContext.colorData);
    if (simple !== null) {
      const body = buildSearchResponse(
        trimmed,
        simple,
        clientContext.universities,
        clientContext.colorData,
      );
      return { ok: true, results: body.results };
    }
  }

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed, locale }),
    });

    if (!res.ok) {
      return { ok: false, error: 'request_failed' };
    }

    const data = (await res.json()) as SearchResponse;
    return { ok: true, results: data.results || [] };
  } catch (error) {
    console.error('Search API error:', error);
    return { ok: false, error: 'request_failed' };
  }
}
