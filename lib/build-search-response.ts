import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';
import type { ColorData } from './load-color-data';
import { filterUniversitiesWithFieldRelaxationWhenOrganizationSet } from './structured-search-filters';
import { semanticSearchWithUniversities } from './semantic-search';

export const SEARCH_RESPONSE_CACHE_TTL_SECONDS = 3600;

export type SearchApiSuccessBody = {
  results: University[];
  totalCount: number;
  filters: QueryUnderstanding['filters'];
  semanticQuery: string;
};

export function buildSearchResponse(
  query: string,
  qu: QueryUnderstanding,
  universities: University[],
  colorData: ColorData,
): SearchApiSuccessBody {
  if (qu.isGibberish) {
    return {
      results: [],
      totalCount: 0,
      filters: qu.filters,
      semanticQuery: qu.semanticQuery,
    };
  }

  const filteredResults = filterUniversitiesWithFieldRelaxationWhenOrganizationSet(
    universities,
    qu,
    colorData,
  );
  const exactCount = filteredResults.length;

  let candidates: University[] = filteredResults;
  let totalCount = exactCount;

  if (exactCount === 0) {
    const semanticResults = semanticSearchWithUniversities(
      query,
      Number.POSITIVE_INFINITY,
      { organization: qu.filters.organization },
      universities,
    );

    if (semanticResults.length > 0) {
      const filteredSemantic = filterUniversitiesWithFieldRelaxationWhenOrganizationSet(
        semanticResults,
        qu,
        colorData,
      );

      if (filteredSemantic.length > 0) {
        candidates = filteredSemantic;
        totalCount = filteredSemantic.length;
      } else {
        candidates = [];
        totalCount = 0;
      }
    }
  }

  let finalResults = candidates;
  if (finalResults.length > 0 && exactCount > 0) {
    finalResults = [...finalResults].sort((a, b) => {
      if (a.oppilaitos !== b.oppilaitos) {
        return a.oppilaitos.localeCompare(b.oppilaitos);
      }
      return (a.ala || '').localeCompare(b.ala || '');
    });
  }

  return {
    results: finalResults,
    totalCount,
    filters: qu.filters,
    semanticQuery: qu.semanticQuery,
  };
}
