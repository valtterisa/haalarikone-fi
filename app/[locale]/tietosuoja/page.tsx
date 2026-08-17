import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/slug-translations';
import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: `${t('privacyTitle')} | Haalarikone`,
    description: t('privacyBody'),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">{t('legal.privacyTitle')}</h1>
      <p className="max-w-[65ch] text-base leading-relaxed text-muted-foreground">
        {t('legal.privacyBody')}
      </p>
      <Link href="/" className="mt-8 inline-flex min-h-11 items-center text-green hover:underline">
        {t('common.backToHome')}
      </Link>
    </div>
  );
}
