import Footer from '@/components/footer';
import Header from '@/components/header';
import { Databuddy } from '@databuddy/sdk/react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getPathname, routing } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SITE_ORIGIN } from '@/lib/site-url';
import { withXDefault } from '@/lib/use-translated-routes';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeRaw } = await params;

  if (!routing.locales.includes(localeRaw as (typeof routing.locales)[number])) {
    notFound();
  }

  const locale = localeRaw as (typeof routing.locales)[number];

  const t = await getTranslations({ locale, namespace: 'meta' });

  const absoluteHome = (loc: typeof locale) =>
    `${SITE_ORIGIN}${getPathname({ locale: loc, href: '/' })}`;

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords: [
      'haalarivärit',
      'opiskelijahaalarivärit',
      'haalarikone',
      'haalaritietokanta',
      'opiskelijahaalarit',
      'yliopiston haalarivärit',
      'AMK haalarivärit',
      'suomen opiskelijakulttuuri',
      'haalarivärit 2026',
      'opiskelijan haalari',
    ],
    authors: [{ name: t('siteName') }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: `${t('siteName')} - Suomen helpoin haalaritietokanta`,
        },
      ],
      type: 'website',
      siteName: t('siteName'),
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: absoluteHome(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteHome(locale),
      languages: withXDefault({
        fi: absoluteHome('fi'),
        en: absoluteHome('en'),
        sv: absoluteHome('sv'),
      }),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = await params;

  if (!routing.locales.includes(localeRaw as (typeof routing.locales)[number])) {
    notFound();
  }

  const locale = localeRaw as (typeof routing.locales)[number];

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Header />
      <main className="flex flex-col items-center bg-[#fffff9]">
        <div className="flex-1 w-full flex flex-col items-center bg-[#fffff9]">
          {children}
          <Databuddy
            clientId="Uu3N9TuBuUAa3wAS4pHNw"
            trackOutgoingLinks={true}
            trackInteractions={true}
            trackWebVitals={false}
            trackErrors={true}
            enableBatching={true}
          />
          <Footer />
        </div>
      </main>
    </NextIntlClientProvider>
  );
}
