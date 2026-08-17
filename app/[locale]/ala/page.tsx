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
import { getUniqueFields, getUniqueUniversities } from '@/lib/get-unique-values';
import { getSlugForEntity, getEntityTranslation } from '@/lib/slug-translations';
import FieldSearchSection from '@/components/field-search-section';
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
      translatedName: capitalizeFirstLetter(getEntityTranslation(field, locale, 'field')),
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
        item: absoluteHomeUrl(locale),
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
              <BreadcrumbPage>{t('fields.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">{t('fields.title')}</h1>
        <p className="mb-8 max-w-[65ch] text-lg text-muted-foreground">
          {t('fields.description', { count, schoolCount })}
        </p>

        <FieldSearchSection universities={universities} colorData={colorData} />

        <ul className="divide-y divide-border">
            {fieldsWithTranslations.map((field) => (
              <li key={field.finnishName}>
                <Link
                  href={routeHref('fields', getSlugForEntity(field.finnishName, locale, 'field'))}
                  className="flex min-h-11 items-center py-3 text-base font-medium text-foreground transition hover:text-green"
                >
                  {field.translatedName}
                </Link>
              </li>
            ))}
          </ul>
      </Page>
    </>
  );
}
