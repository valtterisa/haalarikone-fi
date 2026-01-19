import Footer from "@/components/footer";
import Header from "@/components/header";
import { Databuddy } from "@databuddy/sdk/react";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  
  return {
    metadataBase: new URL("https://haalarikone.fi"),
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords: [
      "haalarivärit",
      "opiskelijahaalarivärit",
      "haalarikone",
      "haalaritietokanta",
      "opiskelijahaalarit",
      "yliopiston haalarivärit",
      "AMK haalarivärit",
      "suomen opiskelijakulttuuri",
      "haalarivärit 2025",
      "opiskelijan haalari",
    ],
    authors: [{ name: t('siteName') }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      images: [
        {
          url: "/haalarikone-og.png",
          width: 1200,
          height: 630,
          alt: `${t('siteName')} - Suomen helpoin haalaritietokanta`,
        },
      ],
      type: "website",
      siteName: t('siteName'),
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `https://haalarikone.fi${locale === 'fi' ? '' : `/${locale}`}`,
    },
    twitter: {
      card: "summary_large_image",
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `https://haalarikone.fi${locale === 'fi' ? '' : `/${locale}`}`,
      languages: {
        fi: "https://haalarikone.fi",
        en: "https://haalarikone.fi/en",
        sv: "https://haalarikone.fi/sv",
      },
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
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Header />
      <main className="flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col items-center">
          {children}
          <Databuddy
            clientId="Uu3N9TuBuUAa3wAS4pHNw"
            trackOutgoingLinks={true}
            trackInteractions={true}
            trackEngagement={true}
            trackExitIntent={true}
            trackBounceRate={true}
            trackWebVitals={true}
            trackErrors={true}
            enableBatching={true}
          />
          <Footer />
        </div>
      </main>
    </NextIntlClientProvider>
  );
}

