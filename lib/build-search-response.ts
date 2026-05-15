import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';
import type { ColorData } from './load-color-data';
import { runFuzzySearch } from './fuzzy-search';

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

  const implicitBaseColors = detectBaseColorFilters(query, colorData);
  const explicitColor = qu.filters.color ? detectBaseColorFilters(qu.filters.color, colorData) : [];
  const requiredBaseColors = Array.from(new Set([...implicitBaseColors, ...explicitColor]));

  let candidates = universities.filter((uni) =>
    universityMatchesFilters(uni, qu.filters, requiredBaseColors, colorData),
  );

  if (candidates.length === 0 && qu.filters.organization && qu.filters.field) {
    candidates = universities.filter((uni) =>
      universityMatchesFilters(
        uni,
        { ...qu.filters, field: undefined },
        requiredBaseColors,
        colorData,
      ),
    );
  }

  const hasExplicitFilters =
    requiredBaseColors.length > 0 ||
    Boolean(
      qu.filters.color ||
        qu.filters.area ||
        qu.filters.field ||
        qu.filters.school ||
        qu.filters.organization,
    );
  const finalResults = rankCandidates(query, qu.semanticQuery, candidates, hasExplicitFilters);

  return {
    results: finalResults,
    totalCount: finalResults.length,
    filters: qu.filters,
    semanticQuery: qu.semanticQuery,
  };
}

export function buildDeterministicQueryUnderstanding(
  query: string,
  universities: University[],
  colorData: ColorData,
): QueryUnderstanding {
  const normalizedQuery = normalize(query);
  const blocked = new Set<string>();

  const area = pickBestContainedMatch(
    normalizedQuery,
    uniqueSorted(universities.map((u) => u.alue)),
    blocked,
  );
  if (area) blocked.add(normalize(area));

  const school = pickBestContainedMatch(
    normalizedQuery,
    uniqueSorted(universities.map((u) => u.oppilaitos)),
    blocked,
  );
  if (school) blocked.add(normalize(school));

  const field = pickBestContainedMatch(
    normalizedQuery,
    uniqueSorted(universities.map((u) => u.ala || '').filter(Boolean)),
    blocked,
  );
  if (field) blocked.add(normalize(field));

  const organization = pickBestContainedMatch(
    normalizedQuery,
    uniqueSorted(universities.map((u) => u.ainejarjesto || '').filter(Boolean)),
    blocked,
  );

  const color = detectPrimaryColorFilter(query, colorData);

  return {
    isGibberish: false,
    filters: {
      color,
      area,
      field,
      school,
      organization,
    },
    semanticQuery: query.trim(),
  };
}

function rankCandidates(
  query: string,
  semanticQuery: string,
  candidates: University[],
  keepAllCandidates: boolean,
): University[] {
  if (candidates.length === 0) return [];

  const fuzzyQuery = semanticQuery.trim() || query.trim();
  const fuzzyResults = runFuzzySearch(fuzzyQuery, candidates);
  const fuzzyScoreById = new Map<number, number>();
  for (const item of fuzzyResults) {
    fuzzyScoreById.set(item.university.id, item.score);
  }

  const queryTokens = tokenize(query);
  const baseCandidates =
    !keepAllCandidates && fuzzyResults.length > 0
      ? fuzzyResults.map((item) => item.university)
      : candidates;

  return [...baseCandidates].sort((a, b) => {
    const aOrgExact = hasExactOrganizationTokenMatch(a, queryTokens);
    const bOrgExact = hasExactOrganizationTokenMatch(b, queryTokens);
    if (aOrgExact !== bOrgExact) return aOrgExact ? -1 : 1;

    const aFuzzy = fuzzyScoreById.get(a.id) ?? 10;
    const bFuzzy = fuzzyScoreById.get(b.id) ?? 10;
    if (aFuzzy !== bFuzzy) return aFuzzy - bFuzzy;

    const aDet = scoreDeterministicMatch(a, queryTokens);
    const bDet = scoreDeterministicMatch(b, queryTokens);
    if (aDet !== bDet) return bDet - aDet;

    if (a.oppilaitos !== b.oppilaitos) {
      return a.oppilaitos.localeCompare(b.oppilaitos);
    }
    return (a.ainejarjesto || '').localeCompare(b.ainejarjesto || '');
  });
}

function hasExactOrganizationTokenMatch(uni: University, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return false;
  const org = normalize(uni.ainejarjesto || '');
  const slug = normalize(uni.slug);
  return queryTokens.some((token) => token === org || token === slug);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tokenize(value: string): string[] {
  const blocked = new Set(['haalari', 'haalarit', 'overall', 'overalls']);
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !blocked.has(token));
}

function scoreDeterministicMatch(uni: University, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const area = normalize(uni.alue);
  const school = normalize(uni.oppilaitos);
  const org = normalize(uni.ainejarjesto || '');
  const field = normalize(uni.ala || '');
  const slug = normalize(uni.slug);
  let score = 0;

  for (const token of tokens) {
    if (area === token) score += 10;
    else if (area.includes(token)) score += 7;
    if (school === token) score += 8;
    else if (school.includes(token)) score += 5;
    if (org === token || slug === token) score += 8;
    else if (org.includes(token) || slug.includes(token)) score += 5;
    if (field === token) score += 6;
    else if (field.includes(token)) score += 3;
  }
  return score;
}

function universityMatchesFilters(
  uni: University,
  filters: QueryUnderstanding['filters'],
  requiredBaseColors: string[],
  colorData: ColorData,
): boolean {
  if (requiredBaseColors.length > 0) {
    const hasColor = (uni.variBase ?? []).some((base) =>
      requiredBaseColors.includes(normalize(base)),
    );
    if (!hasColor) return false;
  }

  if (filters.color) {
    const explicitColorBases = detectBaseColorFilters(filters.color, colorData);
    if (explicitColorBases.length > 0) {
      const explicitMatch = (uni.variBase ?? []).some((base) =>
        explicitColorBases.includes(normalize(base)),
      );
      if (!explicitMatch) return false;
    } else if (!normalize(uni.vari).includes(normalize(filters.color))) {
      return false;
    }
  }

  if (filters.area && !normalize(uni.alue).includes(normalize(filters.area))) return false;
  if (filters.field && !normalize(uni.ala || '').includes(normalize(filters.field))) return false;
  if (filters.school && !normalize(uni.oppilaitos).includes(normalize(filters.school)))
    return false;
  if (filters.organization) {
    const org = normalize(uni.ainejarjesto || '');
    const slug = normalize(uni.slug);
    const wanted = normalize(filters.organization);
    if (!org.includes(wanted) && !slug.includes(wanted)) return false;
  }

  return true;
}

function detectPrimaryColorFilter(query: string, colorData: ColorData): string | undefined {
  const matches = detectBaseColorFilters(query, colorData);
  return matches[0];
}

function detectBaseColorFilters(query: string, colorData: ColorData): string[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const tokens = new Set(tokenize(normalizedQuery));
  const matches = new Set<string>();

  for (const [base, info] of Object.entries(colorData.colors)) {
    const baseNormalized = normalize(base);
    const aliases = buildColorAliases(base, info.main, info.shades).map((value) =>
      normalize(value),
    );
    const hasMatch = aliases.some(
      (alias) => alias && (tokens.has(alias) || normalizedQuery.includes(alias)),
    );
    if (hasMatch) {
      matches.add(baseNormalized);
    }
  }

  return Array.from(matches);
}

function buildColorAliases(base: string, main: string[], shades: string[]): string[] {
  const out = new Set<string>([base, ...main, ...shades]);
  const baseNormalized = normalize(base);

  const extraAliasesByBase: Record<string, string[]> = {
    valkoinen: ['valkoinen', 'valkoiset', 'white'],
    musta: ['musta', 'mustat', 'black'],
    punainen: ['punainen', 'punaiset', 'red'],
    sininen: ['sininen', 'siniset', 'blue'],
    vihreä: ['vihreä', 'vihrea', 'vihreät', 'vihreat', 'green'],
    keltainen: ['keltainen', 'keltaiset', 'yellow'],
    oranssi: ['oranssi', 'oranssit', 'orange'],
    violetti: ['violetti', 'violetit', 'liila', 'liilat', 'purple'],
    pinkki: ['pinkki', 'pinkit', 'pink'],
    harmaa: ['harmaa', 'harmaat', 'gray', 'grey'],
    ruskea: ['ruskea', 'ruskeat', 'brown'],
    turkoosi: ['turkoosi', 'turkoosit', 'turquoise', 'teal', 'cyan'],
  };

  for (const alias of extraAliasesByBase[baseNormalized] ?? []) {
    out.add(alias);
  }

  return Array.from(out);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort(
    (a, b) => b.length - a.length,
  );
}

function pickBestContainedMatch(
  normalizedQuery: string,
  candidates: string[],
  blockedNormalizedValues: Set<string>,
): string | undefined {
  let best: string | undefined;
  let bestLength = 0;

  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    if (!normalizedCandidate || blockedNormalizedValues.has(normalizedCandidate)) continue;
    if (!normalizedQuery.includes(normalizedCandidate)) continue;
    if (normalizedCandidate.length > bestLength) {
      best = candidate;
      bestLength = normalizedCandidate.length;
    }
  }

  return best;
}
