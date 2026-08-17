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
import { getUniqueColors } from '@/lib/get-unique-values';
import { getEntityTranslation, getSlugForEntity } from '@/lib/slug-translations';
import VariSearchSection from '@/components/vari-search-section';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/slug-translations';
import { capitalizeFirstLetter } from '@/lib/utils';
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
  const t = await getTranslations({ locale, namespace: 'colors' });
  const universities = await loadUniversities(locale);
  const colorCount = getUniqueColors(universities).length;
  const description = t('pageDescription', { count: colorCount });

  return {
    title: t('pageTitle'),
    description,
    keywords: [
      'haalarivärit',
      'opiskelijahaalarivärit',
      'haalari värit',
      'kaikki haalarivärit',
      'opiskelijan haalariväri',
      'yliopiston haalarivärit',
      'AMK haalarivärit',
      'teekkarihaalari värit',
    ],
    openGraph: {
      title: t('pageTitle'),
      description,
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
      url: absoluteTranslatedRoute('colors', locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('pageTitle'),
      description,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteTranslatedRoute('colors', locale),
      languages: alternateLanguageUrls('colors'),
    },
  };
}

export default async function ColorIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const universities = await loadUniversities(locale);
  const colorData = await loadColorData();
  const colors = getUniqueColors(universities).sort((a, b) => a.localeCompare(b, 'fi'));
  const colorHexByAnyName = colorData.hexByAlias ?? {};
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
        name: t('colors.title'),
        item: absoluteTranslatedRoute('colors', locale),
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('colors.title'),
    description: t('colors.pageDescription', { count: colors.length }),
    numberOfItems: colors.length,
    itemListElement: colors.map((color, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: capitalizeFirstLetter(getEntityTranslation(color, locale, 'color')),
      url: absoluteTranslatedRoute('colors', locale, getSlugForEntity(color, locale, 'color')),
    })),
  };

  return (
    <>
      <Script
        id="breadcrumb-schema-vari"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="itemlist-schema-vari"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-16">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{t('footer.home')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('colors.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">{t('colors.title')}</h1>
        <p className="mb-8 max-w-[65ch] text-lg text-muted-foreground">
          {t('colors.pageDescription', { count: colors.length })}
        </p>

        <VariSearchSection universities={universities} colorData={colorData} />

        <div className="mx-auto w-full px-2">
          <div className="grid auto-rows-[minmax(4.5rem,auto)] grid-cols-2 gap-2 sm:grid-cols-3">
            {colors.map((color, index) => {
              const translatedColor = capitalizeFirstLetter(
                getEntityTranslation(color, locale, 'color'),
              );
              const colorKey = color.toLowerCase();
              const translatedColorKey = translatedColor.toLowerCase();
              const hex =
                colorHexByAnyName[colorKey] ??
                colorHexByAnyName[translatedColorKey] ??
                '#D1D5DB';
              const isLarge = index % 7 === 0;
              return (
                <Link
                  key={color}
                  href={routeHref('colors', getSlugForEntity(color, locale, 'color'))}
                  className={`flex min-h-11 flex-col justify-end overflow-hidden rounded-sm p-3 text-sm font-semibold transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${
                    isLarge ? 'col-span-2 sm:col-span-1 sm:row-span-2' : ''
                  }`}
                  style={{ backgroundColor: hex, color: hex === '#FFFFFF' || hex === '#FFFF00' ? '#1c1a17' : '#fffef8' }}
                >
                  {translatedColor}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
