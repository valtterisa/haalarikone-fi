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
import { CaretRight } from '@phosphor-icons/react';
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
      <div className="relative overflow-hidden rounded-xl border border-border bg-card transition hover:border-foreground/20 hover:shadow-card">
        <div
          className="absolute inset-y-0 left-0 w-16 border-r border-border sm:w-24"
          style={parseStyles(uni.hex)}
          title={`${t('color')}: ${uni.vari}`}
        />
        <Link
          href={routes.overall(uni.slug)}
          className="group relative flex min-h-[4.5rem] pl-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green sm:pl-24"
          onClick={() => {
            trackResultClick(uni.slug, source);
          }}
        >
          <div className="min-w-0 flex-1 px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <p className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                  {uni.ainejarjesto ?? t('unknownOrganization')}
                </p>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-card sm:h-12 sm:w-12">
                  <Image
                    className="object-contain p-1.5 sm:p-2"
                    src={`/logos/${logoName}.jpg`}
                    fill
                    alt={`${uni.oppilaitos} logo`}
                  />
                </div>
              </div>
              <CaretRight
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100"
                weight="regular"
                aria-hidden
              />
            </div>

            {primaryField ? (
              <p className="mt-1.5 truncate text-[13px] text-muted-foreground">{primaryField}</p>
            ) : null}
          </div>
        </Link>

        <div className="relative flex flex-wrap gap-1.5 py-2.5 pl-20 pr-4 sm:pl-28">
          <HubLink
            href={routes.universities(schoolSlug)}
            source={source}
            type="university"
            slug={schoolSlug}
            className="inline-flex min-h-11 items-center rounded px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-green/10 hover:text-green"
          >
            {uni.oppilaitos}
          </HubLink>
          {city && citySlug ? (
            <HubLink
              href={routes.areas(citySlug)}
              source={source}
              type="area"
              slug={citySlug}
              className="inline-flex min-h-11 items-center rounded px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-green/10 hover:text-green"
            >
              {city}
            </HubLink>
          ) : null}
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded px-2.5 text-xs font-medium tabular-nums text-muted-foreground">
            <span className="h-2 w-2 rounded-sm ring-1 ring-foreground/10" style={parseStyles(uni.hex)} />
            {uni.vari}
          </span>
        </div>
      </div>
    </li>
  );
}
