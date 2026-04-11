import type { University } from '@/types/university';
import { loadUniversities } from './load-universities';

export type SemanticSearchFilterContext = {
  organization?: string;
};

export async function semanticSearch(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  limit: number = 100,
  filterContext?: SemanticSearchFilterContext,
): Promise<University[]> {
  if (!query.trim()) return [];

  const allUniversities = await loadUniversities(locale);
  const baseWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const orgHint = filterContext?.organization?.trim().toLowerCase();
  const queryWordsSet = new Set(baseWords);
  if (orgHint && orgHint.length > 2) {
    queryWordsSet.add(orgHint);
  }
  const queryWords = [...queryWordsSet];

  const scored = allUniversities
    .map((uni) => ({ uni, score: scoreUni(uni, queryWords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const limited = Number.isFinite(limit) && limit >= 0 ? scored.slice(0, limit) : scored;

  return limited.map(({ uni }) => uni);
}

function scoreUni(uni: University, words: string[]): number {
  let score = 0;
  for (const word of words) {
    if (uni.ala?.toLowerCase().includes(word)) score += 10;
    if (uni.oppilaitos.toLowerCase().includes(word)) score += 8;
    if (uni.alue.toLowerCase().includes(word)) score += 5;
    if (uni.ainejärjestö?.toLowerCase().includes(word)) score += 3;
    if (uni.vari.toLowerCase().includes(word)) score += 2;
  }
  return score;
}
