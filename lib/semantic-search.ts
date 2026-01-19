import { Search } from "@upstash/search";
import type { University } from "@/types/university";

export type UpstashSearchResult = {
  id: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  score?: number;
};

function convertUpstashResultToUniversity(
  result: UpstashSearchResult,
  locale: 'fi' | 'en' | 'sv' = 'fi'
): University {
  const content = result.content;
  const metadata = result.metadata || {};

  const getLocalizedValue = (field: unknown): string => {
    if (field === null || field === undefined) {
      return '';
    }
    if (typeof field === 'object' && !Array.isArray(field)) {
      const nested = field as Record<string, string>;
      return nested[locale] || nested.fi || '';
    }
    if (typeof field === 'string') {
      return field;
    }
    return '';
  };

  return {
    id: parseInt(result.id, 10),
    vari: getLocalizedValue(content.vari),
    hex: (metadata.hex as string) || "",
    alue: getLocalizedValue(content.alue),
    ala: getLocalizedValue(content.ala) || null,
    ainejärjestö: (content.ainejärjestö as string) || null,
    oppilaitos: getLocalizedValue(content.oppilaitos),
  };
}

export async function semanticSearch(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  limit: number = 100
): Promise<University[]> {
  const url = process.env.UPSTASH_SEARCH_REST_URL;
  const token = process.env.UPSTASH_SEARCH_REST_TOKEN;

  if (!url || !token) {
    return [];
  }

  try {
    const search = new Search({ url, token });
    const index = search.index("haalarikone-db");

    const searchParams: Parameters<typeof index.search>[0] = {
      query: query.trim(),
      reranking: true,
      limit,
    };

    const results = await index.search(searchParams);

    if (!results || !Array.isArray(results)) {
      return [];
    }

    return results.map((result) =>
      convertUpstashResultToUniversity(result, locale)
    );
  } catch (error) {
    console.error('Semantic search error:', error);
    return [];
  }
}
