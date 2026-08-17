'use client';

import { HubLink } from '@/components/hub-link';
import { trackResultClick, type HubSource } from '@/lib/analytics-events';
import { entitySlug } from '@/lib/entity-slug';
import { getFinnishName } from '@/lib/get-finnish-name';
import { splitCsv } from '@/lib/popular-destinations';
import type { Locale } from '@/lib/slug-translations';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';
import { parseStyles } from '@/lib/utils';
import type { University } from '@/types/university';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

type UniversityCardProps = {
  uni: University;
  source?: HubSource;
};

export default function UniversityCard({ uni, source = 'search' }: UniversityCardProps) {
  const locale: Locale = useLocale() as Locale;
  const t = useTranslations('overall');
  const routes = useTranslatedRoutes();

  const oppilaitosFi = getFinnishName(uni.oppilaitos, locale, 'university');
  const logoName = oppilaitosFi.startsWith('Aalto-yliopisto') ? 'Aalto-yliopisto' : oppilaitosFi;
  const schoolSlug = entitySlug(uni.oppilaitos, locale, 'university');
  const city = splitCsv(uni.alue)[0];
  const citySlug = city ? entitySlug(city, locale, 'area') : null;
  const primaryField = uni.ala?.split(',')[0]?.trim();

  return (
    <li>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-white transition hover:border-border hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <Link
          href={routes.overall(uni.slug)}
          className="group flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-0"
          onClick={() => {
            trackResultClick(uni.slug, source);
          }}
        >
          <div
            className="relative w-20 flex-shrink-0 sm:w-28"
            style={parseStyles(uni.hex)}
            title={`${t('color')}: ${uni.vari}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent" />
          </div>

          <div className="min-w-0 flex-1 px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <p className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                  {uni.ainejarjesto ?? t('unknownOrganization')}
                </p>
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-border/40 bg-white/95 shadow-sm sm:h-12 sm:w-12">
                  <Image
                    className="object-contain p-1.5 sm:p-2"
                    src={`/logos/${logoName}.jpg`}
                    fill
                    alt={`${uni.oppilaitos} logo`}
                  />
                </div>
              </div>
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {primaryField ? (
              <p className="mt-1.5 truncate text-[13px] text-muted-foreground">{primaryField}</p>
            ) : null}
          </div>
        </Link>

        <div className="flex flex-wrap gap-1.5 border-t border-border/50 px-4 py-2.5">
          <HubLink
            href={routes.universities(schoolSlug)}
            source={source}
            type="university"
            slug={schoolSlug}
            className="inline-flex min-h-11 items-center rounded px-2.5 text-xs font-medium text-foreground/80 transition hover:bg-green/10 hover:text-green"
          >
            {uni.oppilaitos}
          </HubLink>
          {city && citySlug ? (
            <HubLink
              href={routes.areas(citySlug)}
              source={source}
              type="area"
              slug={citySlug}
              className="inline-flex min-h-11 items-center rounded px-2.5 text-xs font-medium text-foreground/80 transition hover:bg-green/10 hover:text-green"
            >
              {city}
            </HubLink>
          ) : null}
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded px-2.5 text-xs font-medium text-foreground/70">
            <span
              className="h-2 w-2 rounded-full ring-1 ring-black/10"
              style={parseStyles(uni.hex)}
            />
            {uni.vari}
          </span>
        </div>
      </div>
    </li>
  );
}
