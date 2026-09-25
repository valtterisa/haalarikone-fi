import { resolveResultsAds, withAdSlot } from '@/lib/ads/results-ads';
import type { ResultsAdConfig } from '@/lib/ads/types';
import { describe, expect, it } from 'vitest';

const drophost: ResultsAdConfig = {
  id: 'drophost',
  enabled: true,
  href: 'https://drophost.space/?utm_source=haalarikone&utm_medium=results_promo&utm_campaign=native_card',
  logoSrc: '/ads/drophost.png',
  afterResults: [3],
};

describe('withAdSlot', () => {
  it('sets utm_content for the slot', () => {
    expect(withAdSlot(drophost.href, 3)).toContain('utm_content=slot_3');
  });
});

describe('resolveResultsAds', () => {
  it('returns nothing when there are too few results', () => {
    expect(resolveResultsAds(2, [drophost])).toEqual([]);
  });

  it('inserts after the 3rd result', () => {
    const resolved = resolveResultsAds(10, [drophost]);
    expect(resolved.map((ad) => ad.afterResult)).toEqual([3]);
    expect(resolved.every((ad) => ad.id === 'drophost')).toBe(true);
  });

  it('keeps first ad when two claim the same slot', () => {
    const other: ResultsAdConfig = {
      id: 'other',
      enabled: true,
      href: 'https://example.com/',
      logoSrc: '/ads/other.png',
      afterResults: [3],
    };
    const resolved = resolveResultsAds(5, [drophost, other]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.id).toBe('drophost');
  });

  it('skips disabled ads', () => {
    expect(resolveResultsAds(10, [{ ...drophost, enabled: false }])).toEqual([]);
  });
});
