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
import { CaretRightIcon } from '@phosphor-icons/react';
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

  return (
    <li className="[content-visibility:auto] [contain-intrinsic-size:0_88px]">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card transition hover:border-foreground/20 hover:shadow-card">
        <div
          className="absolute inset-y-0 left-0 w-12 border-r border-border sm:w-24"
          style={parseStyles(uni.hex)}
          title={`${t('color')}: ${uni.vari}`}
        />
        <Link
          href={routes.overall(uni.slug)}
          className="group relative flex items-start gap-2.5 py-3 pl-16 pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green sm:items-center sm:gap-3 sm:py-3.5 sm:pl-28 sm:pr-4"
          onClick={() => {
            trackResultClick(uni.slug, source);
          }}
        >
          <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-card sm:mt-0 sm:h-12 sm:w-12">
            <Image
              className="object-contain px-1.5 py-1 sm:px-2.5 sm:py-2"
              src={`/logos/${logoName}.jpg`}
              fill
              sizes="(min-width: 640px) 48px, 36px"
              alt={`${uni.oppilaitos} logo`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-[15px]">
              {uni.ainejarjesto ?? t('unknownOrganization')}
            </p>
            {uni.ala ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-[13px]">
                {uni.ala}
              </p>
            ) : null}
          </div>
          <CaretRightIcon
            className="mt-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:mt-0 sm:block sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100"
            weight="regular"
            aria-hidden
          />
        </Link>

        <div className="relative flex flex-wrap items-center gap-x-0.5 py-0.5 pl-16 pr-2 sm:gap-1.5 sm:py-1 sm:pl-28 sm:pr-4">
          <HubLink
            href={routes.universities(schoolSlug)}
            source={source}
            type="university"
            slug={schoolSlug}
            className="inline-flex min-h-11 min-w-0 max-w-full items-center truncate rounded px-2 text-xs font-medium text-muted-foreground transition hover:bg-green/10 hover:text-green sm:px-2.5"
          >
            {uni.oppilaitos}
          </HubLink>
          {city && citySlug ? (
            <HubLink
              href={routes.areas(citySlug)}
              source={source}
              type="area"
              slug={citySlug}
              className="inline-flex min-h-11 items-center rounded px-2 text-xs font-medium text-muted-foreground transition hover:bg-green/10 hover:text-green sm:px-2.5"
            >
              {city}
            </HubLink>
          ) : null}
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded px-2 text-xs font-medium tabular-nums text-muted-foreground sm:px-2.5">
            <span className="h-2 w-2 rounded-sm ring-1 ring-foreground/10" style={parseStyles(uni.hex)} />
            {uni.vari}
          </span>
        </div>
      </div>
    </li>
  );
}
