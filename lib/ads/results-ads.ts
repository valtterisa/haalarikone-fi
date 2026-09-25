import type { ResultsAdConfig, ResolvedResultsAd } from '@/lib/ads/types';

export const RESULTS_ADS: ResultsAdConfig[] = [
  {
    id: 'drophost',
    enabled: true,
    href: 'https://drophost.space/?utm_source=haalarikone&utm_medium=results_promo&utm_campaign=native_card',
    logoSrc: '/ads/drophost.png',
    afterResults: [3],
  },
];

export function withAdSlot(href: string, afterResult: number): string {
  const url = new URL(href);
  url.searchParams.set('utm_content', `slot_${afterResult}`);
  return url.toString();
}

export function resolveResultsAds(
  resultCount: number,
  ads: ResultsAdConfig[] = RESULTS_ADS,
): ResolvedResultsAd[] {
  const bySlot = new Map<number, ResultsAdConfig>();

  for (const ad of ads) {
    if (!ad.enabled) continue;
    for (const afterResult of ad.afterResults) {
      if (resultCount >= afterResult && !bySlot.has(afterResult)) {
        bySlot.set(afterResult, ad);
      }
    }
  }

  return [...bySlot.entries()]
    .sort(([a], [b]) => a - b)
    .map(([afterResult, ad]) => ({
      id: ad.id,
      href: withAdSlot(ad.href, afterResult),
      logoSrc: ad.logoSrc,
      afterResult,
    }));
}
