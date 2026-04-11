import type { University } from '@/types/university';
import { loadUniversities } from './load-universities';

export type SemanticSearchFilterContext = {
  organization?: string;
};

export function semanticSearchWithUniversities(
  query: string,
  limit: number,
  filterContext: SemanticSearchFilterContext | undefined,
  allUniversities: University[],
): University[] {
  if (!query.trim()) return [];

  const baseWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const orgHint = filterContext?.organization?.trim().toLowerCase();
  const seen = new Set<string>();
  const queryWords: string[] = [];
  for (const w of baseWords) {
    if (!seen.has(w)) {
      seen.add(w);
      queryWords.push(w);
    }
  }
  if (orgHint && orgHint.length > 2 && !seen.has(orgHint)) {
    queryWords.push(orgHint);
  }

  const scored = allUniversities
    .map((uni) => ({ uni, score: scoreUni(uni, queryWords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const limited = Number.isFinite(limit) && limit >= 0 ? scored.slice(0, limit) : scored;

  return limited.map(({ uni }) => uni);
}

export async function semanticSearch(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  limit: number = 100,
  filterContext?: SemanticSearchFilterContext,
): Promise<University[]> {
  const allUniversities = await loadUniversities(locale);
  return semanticSearchWithUniversities(query, limit, filterContext, allUniversities);
}

function scoreUni(uni: University, words: string[]): number {
  let score = 0;
  for (const word of words) {
    if (uni.ala?.toLowerCase().includes(word)) score += 10;
    if (uni.oppilaitos.toLowerCase().includes(word)) score += 8;
    if (uni.alue.toLowerCase().includes(word)) score += 5;
    if (uni.ainejarjesto?.toLowerCase().includes(word)) score += 3;
    if (uni.vari.toLowerCase().includes(word)) score += 2;
  }
  return score;
}
