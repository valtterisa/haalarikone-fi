import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { PAGE_WIDTH } from '@/components/page';
import { CLAIM_GUIDE_SLUGS } from '@/lib/blog-posts-data';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/slug-translations';

export async function ClaimBanner({ className }: { className?: string }) {
  const t = await getTranslations('claim');
  const locale = (await getLocale()) as Locale;
  const guideSlug = CLAIM_GUIDE_SLUGS[locale] ?? CLAIM_GUIDE_SLUGS.fi;

  return (
    <div
      className={cn(
        'w-full border-b border-accent-foreground/10 bg-accent text-accent-foreground',
        className,
      )}
    >
      <div className={cn(PAGE_WIDTH, 'py-2.5 sm:py-2')}>
        <p className="mx-auto max-w-3xl text-center text-[13px] leading-relaxed sm:text-sm">
          {t('bannerBody')}
          <Link
            href={{ pathname: '/blog/[slug]', params: { slug: guideSlug } }}
            className="group ml-2.5 inline-flex items-center gap-1 font-semibold text-accent-foreground underline decoration-accent-foreground/35 underline-offset-[3px] transition hover:decoration-accent-foreground sm:ml-3"
          >
            {t('bannerLink')}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              weight="bold"
              aria-hidden
            />
          </Link>
        </p>
      </div>
    </div>
  );
}
