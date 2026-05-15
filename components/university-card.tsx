'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { parseStyles } from '@/lib/utils';
import { getFinnishName } from '@/lib/get-finnish-name';
import type { University } from '@/types/university';
import type { Locale } from '@/lib/slug-translations';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';

interface UniversityCardProps {
  uni: University;
}

export default function UniversityCard({ uni }: UniversityCardProps) {
  const locale: Locale = useLocale() as Locale;
  const t = useTranslations('overall');
  const routes = useTranslatedRoutes();

  const oppilaitosFi = getFinnishName(uni.oppilaitos, locale, 'university');
  const logoName = oppilaitosFi.startsWith('Aalto-yliopisto') ? 'Aalto-yliopisto' : oppilaitosFi;

  return (
    <li>
      <Link
        href={routes.overall(uni.slug)}
        className="group flex bg-white rounded-xl border border-border/60 hover:border-border transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-0 overflow-hidden"
      >
        {/* Prominent color block on the left */}
        <div
          className="w-3 sm:w-4 flex-shrink-0"
          style={parseStyles(uni.hex)}
          title={`${t('color')}: ${uni.vari}`}
        />

        <div className="flex-1 min-w-0 p-4 sm:p-5">
          {/* Header: Logo + Organization name */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-secondary/50 border border-border/40 flex-shrink-0">
              <Image
                className="object-contain p-1.5 sm:p-2"
                src={`/logos/${logoName}.jpg`}
                fill
                alt={`${uni.oppilaitos} logo`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {uni.ainejarjesto ?? t('unknownOrganization')}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground font-medium">{uni.oppilaitos}</p>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Details row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {/* Color name with swatch - most prominent */}
            <span className="inline-flex items-center gap-2 font-semibold text-foreground">
              <span
                className="w-4 h-4 rounded-md ring-1 ring-black/10 flex-shrink-0"
                style={parseStyles(uni.hex)}
              />
              {uni.vari}
            </span>
            {uni.ala && (
              <>
                <span className="text-border hidden sm:inline">|</span>
                <span className="truncate max-w-[140px] sm:max-w-none">
                  {uni.ala.split(',')[0].trim()}
                </span>
              </>
            )}
            {uni.alue && (
              <>
                <span className="text-border hidden sm:inline">|</span>
                <span className="truncate">{uni.alue.split(',')[0].trim()}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
