import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Page } from '@/components/page';
import { Link } from '@/i18n/routing';
import Script from 'next/script';
import { Metadata } from 'next';
import { loadUniversities } from '@/lib/load-universities';
import { loadColorData } from '@/lib/load-color-data';
import { getUniqueUniversities } from '@/lib/get-unique-values';
import UniversitySearchSection from '@/components/university-search-section';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/slug-translations';
import { pinPopularFirst, POPULAR_SCHOOLS } from '@/lib/popular-destinations';
import { entitySlug } from '@/lib/entity-slug';
import { HubGrid } from '@/components/hub-grid';
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
  const unique = pinPopularFirst(
    getUniqueUniversities(universities).sort((a, b) => a.localeCompare(b, locale)),
    POPULAR_SCHOOLS,
    locale,
    'university',
  );
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
        entitySlug(uni, locale, 'university'),
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
      <Page>
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
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">
          {t('universities.title')}
        </h1>
        <p className="mb-8 max-w-[65ch] text-lg text-muted-foreground">
          {t('universities.pageDescription')}
        </p>

        <UniversitySearchSection universities={universities} colorData={colorData} />

        <p className="mb-3 text-sm font-semibold text-foreground">{t('universities.popularHeading')}</p>
        <HubGrid>
            {unique.map((uni) => {
              const slug = entitySlug(uni, locale, 'university');
              return (
                <HubGrid.Item
                  key={uni}
                  href={routeHref('universities', slug)}
                  source="university-index"
                  type="university"
                  slug={slug}
                >
                  {uni}
                </HubGrid.Item>
              );
            })}
          </HubGrid>
      </Page>
    </>
  );
}
