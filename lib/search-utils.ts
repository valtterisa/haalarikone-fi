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

export async function searchUniversitiesAPI(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  clientContext?: ClientSearchContext,
): Promise<University[]> {
  if (!query || query.trim().length < 3) {
    return [];
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
      return body.results;
    }
  }

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed, locale }),
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
