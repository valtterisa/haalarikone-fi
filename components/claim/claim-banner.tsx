'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { X } from '@phosphor-icons/react';
import { PAGE_WIDTH } from '@/components/page';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'haalarikone-claim-banner-dismissed';

export function ClaimBanner({ className }: { className?: string }) {
  const t = useTranslations('claim');
  const [visible, setVisible] = useState(false);

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
    <div className={cn('w-full bg-green text-white', className)}>
      <div className={cn(PAGE_WIDTH, 'flex items-center gap-3 py-2')}>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-white/90">
          <span className="font-semibold text-white">{t('bannerTitle')}</span> {t('bannerBody')}
        </p>
        <Link
          href="/kirjaudu"
          className="shrink-0 rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-green transition hover:bg-white/90"
        >
          {t('bannerCta')}
        </Link>
        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
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
