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
import { getUniqueFields, getUniqueUniversities } from '@/lib/get-unique-values';
import { getSlugForEntity, getEntityTranslation } from '@/lib/slug-translations';
import FieldSearchSection from '@/components/field-search-section';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/slug-translations';
import {
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
  const t = await getTranslations({ locale, namespace: 'fields' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    keywords: [
      'opiskelualat',
      'opiskelu alat',
      'haalarivärit aloittain',
      'tekniikka haalari',
      'kauppatieteet haalari',
      'lääketiede haalari',
      'insinööri haalariväri',
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
      url: absoluteTranslatedRoute('fields', locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteTranslatedRoute('fields', locale),
      languages: alternateLanguageUrls('fields'),
    },
  };
}

export default async function FieldIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const universities = await loadUniversities(locale);
  const colorData = await loadColorData();
  const uniqueFields = getUniqueFields(universities);
  const fieldsWithTranslations = uniqueFields
    .map((field) => ({
      finnishName: field,
      translatedName: getEntityTranslation(field, locale, 'field'),
    }))
    .sort((a, b) => a.translatedName.localeCompare(b.translatedName, locale));
  const t = await getTranslations({ locale });

  // Calculate counts for description
  const count = universities.length;
  const schoolCount = getUniqueUniversities(universities).length;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('footer.home'),
        item: absoluteTranslatedRoute('overall', locale),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('fields.title'),
        item: absoluteTranslatedRoute('fields', locale),
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('fields.title'),
    description: t('fields.pageDescription'),
    numberOfItems: fieldsWithTranslations.length,
    itemListElement: fieldsWithTranslations.map((field, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: field.translatedName,
      url: absoluteTranslatedRoute(
        'fields',
        locale,
        getSlugForEntity(field.finnishName, locale, 'field'),
      ),
    })),
  };

  return (
    <>
      <Script
        id="breadcrumb-schema-ala"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="itemlist-schema-ala"
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
              <BreadcrumbPage>{t('fields.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold mb-4">{t('fields.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('fields.description', { count, schoolCount })}
        </p>

        <FieldSearchSection universities={universities} colorData={colorData} />

        <div className="max-w-3xl w-full mx-auto px-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {fieldsWithTranslations.map((field) => (
              <Link
                key={field.finnishName}
                href={routeHref('fields', getSlugForEntity(field.finnishName, locale, 'field'))}
                className="rounded-lg border px-4 py-3 font-medium text-green hover:bg-green/5"
              >
                {field.translatedName}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
