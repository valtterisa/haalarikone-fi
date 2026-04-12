'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { parseStyles } from '@/lib/utils';
import { getFinnishName } from '@/lib/get-finnish-name';
import type { University } from '@/types/university';
import type { Locale } from '@/lib/slug-translations';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { createTranslatedRouteHelpers } from '@/lib/use-translated-routes';

interface UniversityCardProps {
  uni: University;
}

export default function UniversityCard({ uni }: UniversityCardProps) {
  const locale: Locale = useLocale() as Locale;
  const t = useTranslations('overall');
  const routes = createTranslatedRouteHelpers();

  const oppilaitosFi = getFinnishName(uni.oppilaitos, locale, 'university');
  const logoName = oppilaitosFi.startsWith('Aalto-yliopisto') ? 'Aalto-yliopisto' : oppilaitosFi;

  return (
    <li>
      <Link
        href={routes.overall(uni.slug)}
        className="group flex relative overflow-hidden bg-white rounded-xl border border-border/60 hover:border-border transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-0"
      >
        <div
          className="flex-shrink-0 w-20 sm:w-28 relative"
          style={parseStyles(uni.hex)}
          title={`${t('color')}: ${uni.vari}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent" />
        </div>

        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-[15px] font-semibold text-foreground leading-snug tracking-tight">
                {uni.ainejarjesto ?? t('unknownOrganization')}
              </h3>
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/95 shadow-sm border border-border/40 flex-shrink-0">
                <Image
                  className="object-contain p-1.5 sm:p-2"
                  src={`/logos/${logoName}.jpg`}
                  fill
                  alt={`${uni.oppilaitos} logo`}
                />
              </div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-0.5">
              <svg
                className="w-4 h-4 text-muted-foreground"
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

          <div className="mt-1.5 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="font-medium">{uni.oppilaitos}</span>
            {uni.ala && (
              <>
                <span className="text-border">•</span>
                <span>{uni.ala.split(',')[0].trim()}</span>
              </>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-secondary/80 text-foreground/70">
              <span
                className="w-2 h-2 rounded-full ring-1 ring-black/10"
                style={parseStyles(uni.hex)}
              />
              {uni.vari}
            </span>
            {uni.alue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary/80 text-foreground/70">
                {uni.alue.split(',')[0].trim()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
