import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from '@/i18n/routing';
import Script from 'next/script';
import { Metadata } from 'next';
import { loadUniversities } from '@/lib/load-universities';
import { loadColorData } from '@/lib/load-color-data';
import { getUniqueUniversities } from '@/lib/get-unique-values';
import { getSlugForEntity } from '@/lib/slug-translations';
import UniversitySearchSection from '@/components/university-search-section';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/slug-translations';
import {
  absoluteHomeUrl,
  absoluteTranslatedRoute,
  alternateLanguageUrls,
  routeHref,
} from '@/lib/use-translated-routes';

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'universities' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    keywords: [
      'yliopistot',
      'ammattikorkeakoulut',
      'AMK',
      'suomen yliopistot',
      'oppilaitokset',
      'yliopiston haalarivärit',
      'AMK haalarivärit',
    ],
    openGraph: {
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: absoluteTranslatedRoute('universities', locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteTranslatedRoute('universities', locale),
      languages: alternateLanguageUrls('universities'),
    },
  };
}

export default async function UniversityIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const universities = await loadUniversities(locale);
  const colorData = await loadColorData();
  const unique = getUniqueUniversities(universities).sort((a, b) => a.localeCompare(b, 'fi'));
  const t = await getTranslations({ locale });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('footer.home'),
        item: absoluteHomeUrl(locale),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('universities.title'),
        item: absoluteTranslatedRoute('universities', locale),
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('universities.title'),
    description: t('universities.pageDescription'),
    numberOfItems: unique.length,
    itemListElement: unique.map((uni, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: uni,
      url: absoluteTranslatedRoute(
        'universities',
        locale,
        getSlugForEntity(uni, locale, 'university'),
      ),
    })),
  };

  return (
    <>
      <Script
        id="breadcrumb-schema-oppilaitos"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="itemlist-schema-oppilaitos"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{t('footer.home')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('universities.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold mb-4">{t('universities.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t('universities.pageDescription')}</p>

        <UniversitySearchSection universities={universities} colorData={colorData} />

        <div className="max-w-3xl w-full mx-auto px-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {unique.map((uni) => (
              <Link
                key={uni}
                href={routeHref('universities', getSlugForEntity(uni, locale, 'university'))}
                className="rounded-lg border px-4 py-3 font-medium text-green hover:bg-green/5"
              >
                {uni}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
