import type { Locale } from '@/lib/slug-translations';

export type OgKind = 'organization' | 'university';

/** Absolute-path OG image URL for metadata (resolved via metadataBase). */
export function ogImageUrl(kind: OgKind, slug: string, locale: Locale): string {
  const params = new URLSearchParams({
    kind,
    slug,
    locale,
  });
  return `/api/og?${params.toString()}`;
}

export function ogImageAlt(title: string): string {
  return `${title} | Haalarikone`;
}
