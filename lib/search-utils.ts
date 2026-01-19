import type { University } from "@/types/university";

export type SearchResponse = {
  results: University[];
  totalCount: number;
  filters?: {
    color?: string;
    area?: string;
    field?: string;
    school?: string;
  };
  semanticQuery?: string;
};

export async function searchUniversitiesAPI(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi'
): Promise<University[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, locale }),
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json() as SearchResponse;
    return data.results || [];
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
}
