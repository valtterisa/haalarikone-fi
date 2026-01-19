import type { University } from '@/types/university';

export async function rankSemantically(
  candidates: University[],
  semanticQuery: string
): Promise<University[]> {
  if (!semanticQuery.trim() || candidates.length === 0) {
    return candidates;
  }
  
  return candidates.sort((a, b) => {
    const aScore = calculateRelevanceScore(a, semanticQuery);
    const bScore = calculateRelevanceScore(b, semanticQuery);
    return bScore - aScore;
  });
}

function calculateRelevanceScore(uni: University, query: string): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  let score = 0;
  
  for (const word of queryWords) {
    if (uni.ala?.toLowerCase().includes(word)) score += 10;
    if (uni.oppilaitos.toLowerCase().includes(word)) score += 8;
    if (uni.alue.toLowerCase().includes(word)) score += 5;
    if (uni.ainejärjestö?.toLowerCase().includes(word)) score += 3;
    if (uni.vari.toLowerCase().includes(word)) score += 2;
  }
  
  return score;
}

