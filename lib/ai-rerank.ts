import { rerank } from 'ai';
import { cohere } from '@ai-sdk/cohere';
import type { University } from '@/types/university';

const CHUNK_SIZE = 30;
type Locale = 'fi' | 'en' | 'sv';

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function rerankUniversities(
  candidates: University[],
  query: string,
  locale: Locale,
): Promise<University[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || candidates.length <= 1) {
    return candidates;
  }

  const chunks = chunkArray(candidates, CHUNK_SIZE);
  const scoreById = new Map<number, number>();
  const originalIndexById = new Map<number, number>();
  candidates.forEach((c, idx) => {
    originalIndexById.set(c.id, idx);
  });

  for (const chunk of chunks) {
    const documents = chunk.map((c) => ({
      id: c.id,
      color: c.vari,
      area: c.alue,
      field: c.ala ?? '',
      organization: c.ainejärjestö ?? '',
      university: c.oppilaitos,
      locale,
    }));

    const { ranking } = await rerank({
      model: cohere.reranking('rerank-v3.5'),
      documents,
      query: trimmedQuery,
      topN: documents.length,
    });

    for (const item of ranking) {
      const doc = documents[item.originalIndex];
      if (!doc) continue;
      scoreById.set(doc.id, item.score);
    }
  }

  return candidates
    .map((c) => ({
      uni: c,
      score: scoreById.get(c.id) ?? 0,
      idx: originalIndexById.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((x) => x.uni);
}
