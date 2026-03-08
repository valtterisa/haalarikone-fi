import type { University } from '@/types/university';
import { loadUniversities } from './load-universities';

export async function semanticSearch(
  query: string,
  locale: 'fi' | 'en' | 'sv' = 'fi',
  limit: number = 100
): Promise<University[]> {
  if (!query.trim()) return [];

  const allUniversities = await loadUniversities(locale);
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  const scored = allUniversities
    .map((uni) => ({ uni, score: scoreUni(uni, queryWords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ uni }) => uni);

  return scored;
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
