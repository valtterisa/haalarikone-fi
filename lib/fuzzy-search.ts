import Fuse, { type IFuseOptions } from 'fuse.js';
import type { University } from '@/types/university';

export type RankedUniversity = {
  university: University;
  score: number;
  source: 'exact' | 'fuzzy' | 'semantic';
};

const FUSE_OPTIONS: IFuseOptions<University> = {
  includeScore: true,
  threshold: 0.5,
  ignoreLocation: true,
  keys: [
    { name: 'variLabel', weight: 0.3 },
    { name: 'vari', weight: 0.2 },
    { name: 'ainejarjesto', weight: 0.45 },
    { name: 'ala', weight: 0.25 },
    { name: 'oppilaitos', weight: 0.2 },
    { name: 'alue', weight: 0.1 },
  ],
};

const COLOR_VARIANT_GROUPS: string[][] = [
  ['keltainen', 'keltaiset', 'yellow'],
  ['vihreä', 'vihreät', 'vihrea', 'vihreat', 'green'],
  ['punainen', 'punaiset', 'red'],
  ['sininen', 'siniset', 'blue'],
  ['musta', 'mustat', 'black'],
  ['valkoinen', 'valkoiset', 'white'],
  ['harmaa', 'harmaat', 'gray', 'grey'],
  ['oranssi', 'oranssit', 'orange'],
  ['violetti', 'violetit', 'liila', 'liilat', 'purple'],
  ['pinkki', 'pinkit', 'pink'],
  ['ruskea', 'ruskeat', 'brown'],
  ['turkoosi', 'turkoosit', 'turquoise', 'teal', 'cyan'],
];

const COLOR_VARIANT_LOOKUP = new Map<string, string[]>();
for (const group of COLOR_VARIANT_GROUPS) {
  const normalizedGroup = group.map((item) => normalize(item));
  for (const item of normalizedGroup) {
    COLOR_VARIANT_LOOKUP.set(
      item,
      normalizedGroup.filter((candidate) => candidate !== item),
    );
  }
}

const fuseByUniversities = new WeakMap<University[], Fuse<University>>();

export function getFuseForUniversities(universities: University[]): Fuse<University> {
  const existing = fuseByUniversities.get(universities);
  if (existing) return existing;
  const created = new Fuse(universities, FUSE_OPTIONS);
  fuseByUniversities.set(universities, created);
  return created;
}

export function runFuzzySearch(query: string, universities: University[]): RankedUniversity[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const fuse = getFuseForUniversities(universities);
  const mergedById = new Map<number, RankedUniversity>();

  for (const variantQuery of buildEquivalentQueries(trimmed)) {
    for (const entry of fuse.search(variantQuery)) {
      const score = entry.score ?? 1;
      const candidate: RankedUniversity = {
        university: entry.item,
        score,
        source: 'fuzzy',
      };
      const existing = mergedById.get(entry.item.id);
      if (!existing || candidate.score < existing.score) {
        mergedById.set(entry.item.id, candidate);
      }
    }
  }

  return Array.from(mergedById.values()).sort((a, b) => a.score - b.score);
}

function buildEquivalentQueries(query: string): string[] {
  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const variants = new Set<string>([query]);

  for (let i = 0; i < tokens.length; i += 1) {
    const normalizedToken = normalize(tokens[i]);
    const equivalents = COLOR_VARIANT_LOOKUP.get(normalizedToken);
    if (!equivalents) continue;

    for (const equivalent of equivalents) {
      const replacedTokens = [...tokens];
      replacedTokens[i] = equivalent;
      variants.add(replacedTokens.join(' '));
      variants.add(equivalent);
    }
  }

  return Array.from(variants);
}

export function mergeRankedUniversities(groups: RankedUniversity[][]): University[] {
  const merged = new Map<number, RankedUniversity>();

  for (const group of groups) {
    for (const item of group) {
      const existing = merged.get(item.university.id);
      if (!existing || item.score < existing.score) {
        merged.set(item.university.id, item);
      } else if (existing && item.score === existing.score) {
        const sourceRank = sourcePriority(item.source) - sourcePriority(existing.source);
        if (sourceRank < 0) {
          merged.set(item.university.id, item);
        }
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      const sourceRank = sourcePriority(a.source) - sourcePriority(b.source);
      if (sourceRank !== 0) return sourceRank;
      if (a.score !== b.score) return a.score - b.score;
      if (a.university.oppilaitos !== b.university.oppilaitos) {
        return a.university.oppilaitos.localeCompare(b.university.oppilaitos);
      }
      return (a.university.ainejarjesto || '').localeCompare(b.university.ainejarjesto || '');
    })
    .map((entry) => entry.university);
}

function sourcePriority(source: RankedUniversity['source']): number {
  if (source === 'exact') return 0;
  if (source === 'semantic') return 1;
  return 2;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
