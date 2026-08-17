import { getPathname } from '@/i18n/routing';
import { SITE_ORIGIN } from '@/lib/site-url';
import { withXDefault } from '@/lib/use-translated-routes';
import type { Locale } from '@/lib/slug-translations';

export type LegalHref = '/tietosuoja' | '/kayttoehdot';

export function absoluteLegalUrl(href: LegalHref, locale: Locale): string {
  return `${SITE_ORIGIN}${getPathname({ locale, href })}`;
}

export function legalLanguageUrls(href: LegalHref) {
  return withXDefault({
    fi: absoluteLegalUrl(href, 'fi'),
    en: absoluteLegalUrl(href, 'en'),
    sv: absoluteLegalUrl(href, 'sv'),
  });
}
