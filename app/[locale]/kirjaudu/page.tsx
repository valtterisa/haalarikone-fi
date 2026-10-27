import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Page } from '@/components/page';
import { MagicLinkForm } from '@/components/auth/magic-link-form';
import { getSession } from '@/lib/auth-session';
import { ColorAtmosphere } from '@/components/color-atmosphere';
import { loadColorData } from '@/lib/load-color-data';
import Logo from '@/components/logo';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/lib/slug-translations';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ next?: string; error?: string; hint?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: `${t('pageTitle')} | Haalarikone`,
    robots: { index: false, follow: false },
  };
}

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { next, error, hint } = await searchParams;
  const session = await getSession();
  const t = await getTranslations({ locale, namespace: 'auth' });
  const colorData = await loadColorData();
  const atmosphereHexes = Object.values(colorData.colors)
    .map((entry) => entry.color)
    .filter(Boolean);

  const callbackURL = next && next.startsWith('/') ? next : '/oma';

  if (session?.user) {
    redirect(callbackURL);
  }

  return (
    <Page className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] -z-10">
        <ColorAtmosphere hexes={atmosphereHexes} />
      </div>

      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-10">
        <Link href="/" className="mb-8 inline-flex w-fit opacity-90 transition hover:opacity-100">
          <Logo />
        </Link>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t('headline')}
        </h1>
        <p className="mt-3 max-w-[36ch] text-base leading-relaxed text-muted-foreground">
          {t('subhead')}
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {t('linkError')}
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <MagicLinkForm callbackURL={callbackURL} emailHint={hint} />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-foreground/50">
          {t('legalNote')}
        </p>
      </div>
    </Page>
  );
}
