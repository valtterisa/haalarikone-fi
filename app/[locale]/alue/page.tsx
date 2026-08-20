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
import { getUniqueAreas } from '@/lib/get-unique-values';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';
import { getTranslations } from 'next-intl/server';
import { pinPopularFirst, POPULAR_AREAS } from '@/lib/popular-destinations';
import { entitySlug } from '@/lib/entity-slug';
import {
  absoluteHomeUrl,
  absoluteTranslatedRoute,
  alternateLanguageUrls,
  routeHref,
} from '@/lib/use-translated-routes';
import { HubGrid, HubGridItem } from '@/components/hub-grid';
import { capitalizeFirstLetter } from '@/lib/utils';

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'areas' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
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
      url: absoluteTranslatedRoute('areas', locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteTranslatedRoute('areas', locale),
      languages: alternateLanguageUrls('areas'),
    },
  };
}

export default async function AreaIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const universities = await loadUniversities(locale);
  const unique = pinPopularFirst(getUniqueAreas(universities), POPULAR_AREAS, locale, 'area');
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
        name: t('areas.title'),
        item: absoluteTranslatedRoute('areas', locale),
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('areas.title'),
    description: t('areas.pageDescription'),
    numberOfItems: unique.length,
    itemListElement: unique.map((area, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: area,
      url: absoluteTranslatedRoute('areas', locale, getSlugForEntity(area, locale, 'area')),
    })),
  };

  return (
    <>
      <Script
        id="breadcrumb-schema-alue"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="itemlist-schema-alue"
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
              <BreadcrumbPage>{t('areas.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">{t('areas.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t('areas.pageDescription')}</p>

        <p className="mb-3 text-sm font-semibold text-foreground">{t('areas.popularHeading')}</p>
        <HubGrid>
          {unique.map((area) => {
            const slug = entitySlug(area, locale, 'area');
            return (
              <HubGridItem
                key={area}
                href={routeHref('areas', slug)}
                source="area-index"
                type="area"
                slug={slug}
              >
                {capitalizeFirstLetter(area)}
              </HubGridItem>
            );
          })}
        </HubGrid>
      </Page>
    </>
  );
}
