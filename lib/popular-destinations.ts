import { getLocalizedName } from '@/lib/get-finnish-name';
import type { Locale } from '@/lib/slug-translations';

export const POPULAR_AREAS = ['Turku', 'Oulu', 'Jyväskylä', 'Tampere'] as const;
export const POPULAR_SCHOOLS = ['Tampereen yliopisto', 'Metropolia', 'Turun AMK'] as const;

export function pinPopularFirst(
  items: string[],
  popularFinnish: readonly string[],
  locale: Locale,
  type: 'area' | 'university',
): string[] {
  const popularLocalized = popularFinnish.map((name) => getLocalizedName(name, locale, type));
  const pinned: string[] = [];
  const used = new Set<string>();

  for (const candidate of [...popularLocalized, ...popularFinnish]) {
    const match = items.find((item) => item.toLowerCase() === candidate.toLowerCase());
    if (match && !used.has(match.toLowerCase())) {
      pinned.push(match);
      used.add(match.toLowerCase());
    }
  }

  const rest = items.filter((item) => !used.has(item.toLowerCase()));
  return [...pinned, ...rest];
}

export function splitCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

export function joinNames(names: string[], limit = 8): string {
  return names.slice(0, limit).join(', ');
}
