import { describe, it, expect } from 'vitest';
import overallData from '@/data/overall_colors_upstash.json';

describe('overall_colors_upstash.json', () => {
  it('has unique ainejarjestoSlug for every row', () => {
    const rows = overallData as Array<{ id: string; content?: { ainejarjestoSlug?: string } }>;
    const slugs = rows.map((r) => r.content?.ainejarjestoSlug?.trim()).filter(Boolean) as string[];
    expect(slugs.length).toBe(rows.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses ainejarjesto key not ainejärjestö', () => {
    const rows = overallData as Array<{ content?: Record<string, unknown> }>;
    for (const r of rows) {
      expect(r.content).toBeDefined();
      expect(r.content).not.toHaveProperty('ainejärjestö');
      expect(r.content?.ainejarjestoSlug).toBeTruthy();
    }
  });
});
