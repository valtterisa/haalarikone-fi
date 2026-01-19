"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseStyles } from "@/lib/utils";
import { getSlugForEntity } from "@/lib/slug-translations";
import { getFinnishName } from "@/lib/get-finnish-name";
import type { University } from "@/types/university";
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useTranslatedRoutes } from '@/lib/use-translated-routes';

interface UniversityCardProps {
  uni: University;
}

export default function UniversityCard({ uni }: UniversityCardProps) {
  const router = useRouter();
  const locale = useLocale() as 'fi' | 'en' | 'sv';
  const t = useTranslations('overall');
  const routes = useTranslatedRoutes();

  const oppilaitosFi = getFinnishName(uni.oppilaitos, locale, 'university');
  const logoName = oppilaitosFi.startsWith("Aalto-yliopisto") ? "Aalto-yliopisto" : oppilaitosFi;

  return (
    <li
      className="group relative overflow-hidden bg-white rounded-xl border border-border/60 hover:border-border transition-all duration-300 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
      onClick={() => router.push(routes.overall(String(uni.id)))}
    >
      <div className="flex">
        <div 
          className="flex-shrink-0 w-16 sm:w-20 flex items-center justify-center relative"
          style={parseStyles(uni.hex)}
          title={`${t('color')}: ${uni.vari}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent" />
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white/95 shadow-sm border border-white/20">
            <Image
              className="object-contain p-1"
              src={`/logos/${logoName}.jpg`}
              fill
              alt={`${uni.oppilaitos} logo`}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-foreground leading-snug tracking-tight">
              {uni.ainejärjestö ?? t('unknownOrganization')}
            </h3>
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
                <span>{uni.ala.split(",")[0].trim()}</span>
              </>
            )}
          </div>

          <div
            className="mt-2.5 flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={routes.colors(getSlugForEntity(uni.vari, locale, 'color'))}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-200 bg-secondary/80 text-foreground/70 hover:bg-green/15 hover:text-green"
              onClick={(e) => e.stopPropagation()}
            >
              <span 
                className="w-2 h-2 rounded-full ring-1 ring-black/10" 
                style={parseStyles(uni.hex)}
              />
              {uni.vari}
            </Link>
            {uni.alue && (
              <Link
                href={routes.areas(getSlugForEntity(uni.alue.split(",")[0].trim(), locale, 'area'))}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all duration-200 bg-secondary/80 text-foreground/70 hover:bg-green/15 hover:text-green"
                onClick={(e) => e.stopPropagation()}
              >
                {uni.alue.split(",")[0].trim()}
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
