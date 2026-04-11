import type { Locale } from '@/lib/slug-translations';

export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haalarikone.fi').replace(
  /\/$/,
  '',
);

export function localeSiteBaseUrl(locale: Locale): string {
  return locale === 'fi' ? SITE_ORIGIN : `${SITE_ORIGIN}/${locale}`;
}
