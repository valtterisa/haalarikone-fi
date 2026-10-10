'use client';

import type { ResolvedResultsAd } from '@/lib/ads/types';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type ResultsAdCardProps = {
  ad: ResolvedResultsAd;
};

export function ResultsAdCard({ ad }: ResultsAdCardProps) {
  const t = useTranslations('ads');
  const item = useTranslations(`ads.items.${ad.id}`);

  return (
    <li className="list-none" data-ad-id={ad.id} data-ad-slot={ad.afterResult}>
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 transition hover:border-green/40 hover:bg-green/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-green sm:items-center sm:gap-4 sm:px-4 sm:py-3.5"
      >
        <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-xl sm:mt-0 sm:h-12 sm:w-12">
          <Image
            src={ad.logoSrc}
            alt=""
            fill
            sizes="(min-width: 640px) 48px, 36px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
              {t('badge')}
            </span>
            <span className="text-[10px] text-muted-foreground sm:text-[11px]">
              {item('brand')}
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-[15px]">
            {item('title')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-[13px]">
            {item('description')}
          </p>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-green sm:mt-0">
          {item('cta')}
          <ArrowUpRightIcon className="h-3.5 w-3.5" weight="bold" aria-hidden />
        </span>
      </a>
    </li>
  );
}
