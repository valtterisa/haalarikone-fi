import { describe, it, expect, vi } from 'vitest';
import type { University } from '@/types/university';

vi.mock('ai', () => ({
  rerank: async (args: { documents: Array<{ id: number }> }) => {
    const scoreForId = (id: number): number => {
      if (id === 1) return 1;
      if (id === 2) return 10;
      if (id === 3) return 5;
      return 0;
    };

    const { documents } = args;
    return {
      ranking: documents.map((doc, originalIndex) => ({
        originalIndex,
        score: scoreForId(doc.id),
      })),
    };
  },
}));

vi.mock('@ai-sdk/cohere', () => ({
  cohere: {
    reranking: () => 'cohere-mocked-reranking-model',
  },
}));

import { rerankUniversities } from './ai-rerank';

const candidates: University[] = [
  {
    id: 1,
    vari: 'punainen',
    hex: '#ff0000',
    alue: 'Helsinki',
    ala: 'fysiikka',
    ainejärjestö: 'Fyysikkokilta',
    oppilaitos: 'Helsingin yliopisto',
  },
  {
    id: 2,
    vari: 'sininen',
    hex: '#0000ff',
    alue: 'Tampere',
    ala: 'tietotekniikka',
    ainejärjestö: null,
    oppilaitos: 'Tampereen yliopisto',
  },
  {
    id: 3,
    vari: 'vihreä',
    hex: '#00ff00',
    alue: 'Oulu',
    ala: null,
    ainejärjestö: null,
    oppilaitos: 'Oulun yliopisto',
  },
];

describe('rerankUniversities', () => {
  it('returns all candidates sorted by AI score', async () => {
    const result = await rerankUniversities(candidates, 'test query', 'fi');

    expect(result.map((u) => u.id)).toEqual([2, 3, 1]);
  });
});
