import type { ColorData } from '@/lib/load-color-data';
import type { University } from '@/types/university';

type SearchIndex = {
  byToken: Map<string, Set<number>>;
  byColor: Map<string, Set<number>>;
  byOrganizationSlug: Map<string, Set<number>>;
  byId: Map<number, University>;
};

const indexCache = new WeakMap<University[], SearchIndex>();

export function getSearchIndex(universities: University[]): SearchIndex {
  const existing = indexCache.get(universities);
  if (existing) return existing;

  const byToken = new Map<string, Set<number>>();
  const byColor = new Map<string, Set<number>>();
  const byOrganizationSlug = new Map<string, Set<number>>();
  const byId = new Map<number, University>();

  for (const uni of universities) {
    byId.set(uni.id, uni);

    const tokens = collectUniversityTokens(uni);
    tokens.forEach((token) => {
      const bucket = byToken.get(token) ?? new Set<number>();
      bucket.add(uni.id);
      byToken.set(token, bucket);
    });

    for (const baseColor of uni.variBase ?? []) {
      const normalized = normalize(baseColor);
      if (!normalized) continue;
      const bucket = byColor.get(normalized) ?? new Set<number>();
      bucket.add(uni.id);
      byColor.set(normalized, bucket);
    }

    const slug = normalize(uni.slug);
    if (slug) {
      const bucket = byOrganizationSlug.get(slug) ?? new Set<number>();
      bucket.add(uni.id);
      byOrganizationSlug.set(slug, bucket);
    }
  }

  const created: SearchIndex = { byToken, byColor, byOrganizationSlug, byId };
  indexCache.set(universities, created);
  return created;
}

export function tokenizeQuery(query: string): string[] {
  return splitWords(normalize(query)).filter((token) => token.length > 1);
}

export function detectBaseColorFilters(query: string, colorData: ColorData): string[] {
  const normalizedQuery = normalize(query);
  const queryTokens = splitWords(normalizedQuery);
  const matched = new Set<string>();

  for (const [base, variants] of Object.entries(colorData.colors)) {
    const baseNormalized = normalize(base);
    const allVariants = [...variants.main, ...variants.shades]
      .map((item) => normalize(item))
      .filter(Boolean);

    if (
      queryTokens.some(
        (token) =>
          token === baseNormalized ||
          allVariants.some((variant) => variant === token || token.startsWith(variant.slice(0, 4))),
      )
    ) {
      matched.add(baseNormalized);
    }
  }

  return Array.from(matched);
}

export function collectExactCandidateIds(
  index: SearchIndex,
  queryTokens: string[],
  baseColors: string[],
): Set<number> {
  const tokenMatches = new Set<number>();
  const colorMatches = setFromBuckets(baseColors.map((color) => index.byColor.get(color)));

  for (const token of queryTokens) {
    const tokenBucket = index.byToken.get(token);
    if (tokenBucket) {
      tokenBucket.forEach((id) => tokenMatches.add(id));
    }

    index.byToken.forEach((ids, indexedToken) => {
      if (indexedToken.startsWith(token) || token.startsWith(indexedToken)) {
        ids.forEach((id) => tokenMatches.add(id));
      }
    });
  }

  if (baseColors.length > 0) {
    if (tokenMatches.size === 0) return colorMatches;
    return intersectSets(colorMatches, tokenMatches);
  }

  return tokenMatches;
}

export function idsToUniversities(index: SearchIndex, ids: Set<number>): University[] {
  const out: University[] = [];
  ids.forEach((id) => {
    const uni = index.byId.get(id);
    if (uni) out.push(uni);
  });
  return out;
}

function collectUniversityTokens(uni: University): Set<string> {
  const source = [
    uni.ainejarjesto ?? '',
    uni.ala ?? '',
    uni.oppilaitos,
    uni.alue,
    uni.slug,
    uni.vari,
  ];
  const tokens = new Set<string>();

  for (const part of source) {
    const normalized = normalize(part);
    if (!normalized) continue;
    tokens.add(normalized);
    for (const token of splitWords(normalized)) {
      tokens.add(token);
    }
  }

  return tokens;
}

function splitWords(value: string): string[] {
  return value.split(/[^a-z0-9]+/).filter(Boolean);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function setFromBuckets(buckets: Array<Set<number> | undefined>): Set<number> {
  const result = new Set<number>();
  for (const bucket of buckets) {
    if (!bucket) continue;
    bucket.forEach((id) => result.add(id));
  }
  return result;
}

function intersectSets(left: Set<number>, right: Set<number>): Set<number> {
  const result = new Set<number>();
  left.forEach((value) => {
    if (right.has(value)) result.add(value);
  });
  return result;
}
