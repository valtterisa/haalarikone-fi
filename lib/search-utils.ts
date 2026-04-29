import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';
import { parseSimpleQueryWithColorData } from '@/lib/parse-simple-query';
import { buildSearchResponse } from '@/lib/build-search-response';
import {
  collectExactCandidateIds,
  detectBaseColorFilters,
  getSearchIndex,
  idsToUniversities,
  tokenizeQuery,
} from '@/lib/client-search-index';
import { mergeRankedUniversities, runFuzzySearch, type RankedUniversity } from '@/lib/fuzzy-search';

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
    const queryBaseColors = detectBaseColorFilters(trimmed, clientContext.colorData);
    if (options?.waitForSemanticEnrichment) {
      const semanticResults = await fetchApiResults(trimmed, locale);
      return preferSemanticWhenAvailable(localResults, semanticResults, queryBaseColors);
    }
    if (options?.onSemanticEnrichment) {
      void fetchApiResults(trimmed, locale).then((semanticResults) => {
        const merged = preferSemanticWhenAvailable(localResults, semanticResults, queryBaseColors);
        options.onSemanticEnrichment?.(merged);
      });
    }
    return localResults;
  }

  return fetchApiResults(trimmed, locale);
}

function searchLocalHybrid(query: string, clientContext: ClientSearchContext): University[] {
  const { universities, colorData } = clientContext;
  const simple = parseSimpleQueryWithColorData(query, colorData);
  if (simple !== null) {
    const body = buildSearchResponse(query, simple, universities, colorData);
    return body.results;
  }

  const index = getSearchIndex(universities);
  const queryTokens = tokenizeQuery(query);
  const baseColors = detectBaseColorFilters(query, colorData);
  const exactIds = collectExactCandidateIds(index, queryTokens, baseColors);
  const exactUniversities = idsToUniversities(index, exactIds);
  const fuzzyRanked = runFuzzySearch(query, universities);
  const normalizedQuery = normalizeForCompare(query);
  const rankingTokens = normalizedQuery.split(/[^a-z0-9]+/).filter(Boolean);

  const exactRanked: RankedUniversity[] = exactUniversities.map((university) => ({
    university,
    score: computeExactScoreBoost(university, normalizedQuery, rankingTokens),
    source: 'exact',
  }));

  const merged = mergeRankedUniversities([exactRanked, fuzzyRanked]);
  if (baseColors.length === 0) return merged;
  return merged.filter((uni) =>
    (uni.variBase ?? []).some((base) => baseColors.includes(normalizeForCompare(base))),
  );
}

function mergeLocalAndSemantic(
  localResults: University[],
  semanticResults: University[],
  queryBaseColors: string[],
): University[] {
  const localRanked: RankedUniversity[] = localResults.map((university, idx) => ({
    university,
    score: idx / (localResults.length || 1),
    source: 'exact',
  }));
  const semanticRanked: RankedUniversity[] = semanticResults.map((university, idx) => ({
    university,
    score: 0.3 + idx / ((semanticResults.length || 1) * 10),
    source: 'semantic',
  }));
  const merged = mergeRankedUniversities([localRanked, semanticRanked]);
  if (queryBaseColors.length === 0) return merged;
  return merged.filter((uni) =>
    (uni.variBase ?? []).some((base) => queryBaseColors.includes(normalizeForCompare(base))),
  );
}

function preferSemanticWhenAvailable(
  localResults: University[],
  semanticResults: University[],
  queryBaseColors: string[],
): University[] {
  if (queryBaseColors.length === 0) {
    return mergeLocalAndSemantic(localResults, semanticResults, queryBaseColors);
  }
  const semanticFiltered = filterByBaseColors(semanticResults, queryBaseColors);
  if (semanticFiltered.length > 0) {
    return semanticFiltered;
  }
  const localFiltered = filterByBaseColors(localResults, queryBaseColors);
  if (localFiltered.length > 0) {
    return localFiltered;
  }
  return mergeLocalAndSemantic(localResults, semanticResults, queryBaseColors);
}

function filterByBaseColors(results: University[], queryBaseColors: string[]): University[] {
  if (queryBaseColors.length === 0) return results;
  return results.filter((uni) =>
    (uni.variBase ?? []).some((base) => queryBaseColors.includes(normalizeForCompare(base))),
  );
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

function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function computeExactScoreBoost(
  university: University,
  normalizedQuery: string,
  queryTokens: string[],
): number {
  if (!normalizedQuery) return 0;

  const organization = normalizeForCompare(university.ainejarjesto ?? '');
  const slug = normalizeForCompare(university.slug);
  const field = normalizeForCompare(university.ala ?? '');
  const school = normalizeForCompare(university.oppilaitos);
  const area = normalizeForCompare(university.alue);

  if (organization === normalizedQuery) return -8;
  if (slug === normalizedQuery) return -7;
  if (organization.startsWith(normalizedQuery)) return -6;
  if (slug.startsWith(normalizedQuery)) return -5.5;
  if (organization.includes(normalizedQuery)) return -5;
  if (slug.includes(normalizedQuery)) return -4.5;

  if (field === normalizedQuery || school === normalizedQuery || area === normalizedQuery)
    return -3;
  if (
    field.startsWith(normalizedQuery) ||
    school.startsWith(normalizedQuery) ||
    area.startsWith(normalizedQuery)
  ) {
    return -2;
  }
  if (
    field.includes(normalizedQuery) ||
    school.includes(normalizedQuery) ||
    area.includes(normalizedQuery)
  ) {
    return -1.5;
  }

  const tokenComparable = normalizedQuery.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokenComparable.length > 0) {
    const candidates = [organization, slug, field, school, area];
    if (tokenComparable.every((token) => candidates.some((value) => value.includes(token)))) {
      return -1;
    }
  }

  let tokenBoost = 0;
  for (const token of queryTokens) {
    if (!token || token.length < 3) continue;
    if (
      token === 'haalari' ||
      token === 'haalarit' ||
      token === 'overall' ||
      token === 'overalls'
    ) {
      continue;
    }
    if (area === token) tokenBoost -= 1.2;
    else if (area.includes(token)) tokenBoost -= 0.8;
    if (organization === token || slug === token) tokenBoost -= 1;
    else if (organization.includes(token) || slug.includes(token)) tokenBoost -= 0.6;
    if (school === token) tokenBoost -= 0.8;
    else if (school.includes(token)) tokenBoost -= 0.5;
    if (field === token) tokenBoost -= 0.6;
    else if (field.includes(token)) tokenBoost -= 0.35;
  }

  return -0.25 + tokenBoost;
}
