'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight, X } from '@phosphor-icons/react';
import { PAGE_WIDTH } from '@/components/page';
import { CLAIM_GUIDE_SLUGS } from '@/lib/blog-posts-data';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/slug-translations';

const STORAGE_KEY = 'haalarikone-claim-banner-v2-dismissed';

export function ClaimBanner({ className }: { className?: string }) {
  const t = useTranslations('claim');
  const locale = useLocale() as Locale;
  const [visible, setVisible] = useState(false);
  const guideSlug = CLAIM_GUIDE_SLUGS[locale] ?? CLAIM_GUIDE_SLUGS.fi;

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'w-full border-b border-accent-foreground/10 bg-accent text-accent-foreground',
        className,
      )}
    >
      <div className={cn(PAGE_WIDTH, 'relative py-2.5 sm:py-2')}>
        <p className="mx-auto max-w-3xl px-11 text-center text-[13px] leading-relaxed sm:px-12 sm:text-sm">
          {t('bannerBody')}{' '}
          <Link
            href={{ pathname: '/blog/[slug]', params: { slug: guideSlug } }}
            className="group inline-flex items-center gap-1 font-semibold text-accent-foreground underline decoration-accent-foreground/35 underline-offset-[3px] transition hover:decoration-accent-foreground"
          >
            {t('bannerLink')}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              weight="bold"
              aria-hidden
            />
          </Link>
        </p>
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-accent-foreground/55 transition hover:bg-accent-foreground/10 hover:text-accent-foreground sm:right-2"
          aria-label={t('bannerDismiss')}
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, '1');
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
        >
          <X className="h-3.5 w-3.5" weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}
