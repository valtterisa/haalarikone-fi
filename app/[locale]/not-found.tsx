import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <div className="flex min-h-[60dvh] w-full flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
        {t('pageNotFound')}
      </h1>
      <p className="mt-3 max-w-[40ch] text-muted-foreground">{t('notFoundHint')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-md bg-green px-5 text-sm font-semibold text-white transition hover:bg-green/90 active:scale-[0.98]"
      >
        {t('backToHome')}
      </Link>
    </div>
  );
}
