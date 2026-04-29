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
    { name: 'ainejarjesto', weight: 0.45 },
    { name: 'ala', weight: 0.25 },
    { name: 'oppilaitos', weight: 0.2 },
    { name: 'alue', weight: 0.1 },
  ],
};

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
  return getFuseForUniversities(universities)
    .search(trimmed)
    .map((entry) => ({
      university: entry.item,
      score: entry.score ?? 1,
      source: 'fuzzy',
    }));
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
