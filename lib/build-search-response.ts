import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';
import type { ColorData } from './load-color-data';
import { filterUniversitiesWithFieldRelaxationWhenOrganizationSet } from './structured-search-filters';
import { semanticSearchWithUniversities } from './semantic-search';
import { detectBaseColorFilters } from './client-search-index';

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
    const rankingTokens = buildRankingTokens(query, qu, colorData);
    finalResults = [...finalResults].sort((a, b) => {
      const scoreDiff =
        scoreResultForQuery(b, rankingTokens) - scoreResultForQuery(a, rankingTokens);
      if (scoreDiff !== 0) return scoreDiff;
      if (a.oppilaitos !== b.oppilaitos) {
        return a.oppilaitos.localeCompare(b.oppilaitos);
      }
      return (a.ainejarjesto || '').localeCompare(b.ainejarjesto || '');
    });
  }

  const queryBaseColors = detectBaseColorFilters(query, colorData);
  if (queryBaseColors.length > 0) {
    finalResults = finalResults.filter((uni) =>
      (uni.variBase ?? []).some((base) => queryBaseColors.includes(base.toLowerCase().trim())),
    );
    totalCount = finalResults.length;
  }

  return {
    results: finalResults,
    totalCount,
    filters: qu.filters,
    semanticQuery: qu.semanticQuery,
  };
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function buildRankingTokens(query: string, qu: QueryUnderstanding, colorData: ColorData): string[] {
  const baseColors = detectBaseColorFilters(query, colorData);
  const blocked = new Set<string>([...baseColors, 'haalari', 'haalarit', 'overall', 'overalls']);
  const raw = normalize(`${query} ${qu.semanticQuery}`);
  return raw
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !blocked.has(token));
}

function scoreResultForQuery(uni: University, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const area = normalize(uni.alue);
  const school = normalize(uni.oppilaitos);
  const org = normalize(uni.ainejarjesto || '');
  const field = normalize(uni.ala || '');
  let score = 0;

  for (const token of tokens) {
    if (area === token) score += 12;
    else if (area.includes(token)) score += 8;
    if (school === token) score += 8;
    else if (school.includes(token)) score += 5;
    if (org === token) score += 6;
    else if (org.includes(token)) score += 4;
    if (field === token) score += 4;
    else if (field.includes(token)) score += 2;
  }
  return score;
}
