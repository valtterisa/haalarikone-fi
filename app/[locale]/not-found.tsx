import { NotFoundMark } from '@/components/not-found-mark';
import { Page } from '@/components/page';
import { loadColorData } from '@/lib/load-color-data';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common');
  const colorData = await loadColorData();
  const hexes = Object.values(colorData.colors)
    .map((entry) => entry.color)
    .filter(Boolean);

  return (
    <Page.Missing className="flex min-h-[60dvh] flex-col items-center justify-center">
      <NotFoundMark hexes={hexes} />
      <h1 className="mt-10 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t('notFoundTitle')}
      </h1>
      <p className="mt-3 max-w-[40ch] text-muted-foreground">{t('notFoundHint')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-md bg-green px-5 text-sm font-semibold text-white transition hover:bg-green/90 active:scale-[0.98]"
      >
        {t('backToHome')}
      </Link>
    </Page.Missing>
  );
}
