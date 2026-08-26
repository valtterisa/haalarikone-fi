import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Page } from '@/components/page';
import { loadUniversities } from '@/lib/load-universities';
import { getTaxonomyEntities, resolveTaxonomyHub } from '@/lib/taxonomy-hub';
import { getSlugForEntity } from '@/lib/slug-translations';
import { capitalizeFirstLetter } from '@/lib/utils';
import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import Script from 'next/script';
import UniversityCard from '@/components/university-card';
import RelatedTopics, {
  RelatedTopicsChip,
  RelatedTopicsChips,
} from '@/components/related-topic-chips';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTranslatedRoute, routeHref, withXDefault } from '@/lib/use-translated-routes';
import { localeSiteBaseUrl } from '@/lib/site-url';
import { splitCsv } from '@/lib/popular-destinations';

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: 'fi' | 'en' | 'sv'; slug: string }>;
};

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueFields = getTaxonomyEntities(universities, 'field');

  const params = [];
  for (const locale of routing.locales) {
    for (const field of uniqueFields) {
      params.push({
        locale,
        slug: getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field'),
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale);
  const hub = resolveTaxonomyHub(universities, slug, locale, 'field');

  if (!hub) {
    const t = await getTranslations({ locale, namespace: 'fields' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const { canonical: field, localized: translatedField, rows: fieldData } = hub;
  const universitiesList = Array.from(new Set(fieldData.map((u) => u.oppilaitos)));

  const t = await getTranslations({ locale });
  const capitalizedField = capitalizeFirstLetter(translatedField);
  const baseUrl = localeSiteBaseUrl(locale);
  const fieldSlug = getSlugForEntity(field, locale, 'field');

  return {
    title: `${capitalizedField} - ${t('colors.title')} | Haalarikone`,
    description: t('fields.description', {
      count: fieldData.length,
      schoolCount: universitiesList.length,
    }),
    keywords: [
      `${capitalizedField} ${t('colors.title').toLowerCase()}`,
      `${capitalizedField} haalarit`,
      `${capitalizedField} opiskelijahaalarit`,
      'haalarivärit',
      'opiskelijahaalarit',
      'suomen opiskelijakulttuuri',
      ...universitiesList.slice(0, 5).map((u) => `${capitalizedField} ${u}`),
    ],
    openGraph: {
      title: `${capitalizedField} - ${t('colors.title')} | Haalarikone`,
      description: t('fields.description', {
        count: fieldData.length,
        schoolCount: universitiesList.length,
      }),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: `${capitalizedField} ${t('colors.title').toLowerCase()}`,
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('fields', locale, fieldSlug)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedField} - ${t('colors.title')} | Haalarikone`,
      description: t('fields.description', {
        count: fieldData.length,
        schoolCount: universitiesList.length,
      }),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('fields', locale, fieldSlug)}`,
      languages: withXDefault({
        fi: `${localeSiteBaseUrl('fi')}${getTranslatedRoute('fields', 'fi', getSlugForEntity(field, 'fi', 'field'))}`,
        en: `${localeSiteBaseUrl('en')}${getTranslatedRoute('fields', 'en', getSlugForEntity(field, 'en', 'field'))}`,
        sv: `${localeSiteBaseUrl('sv')}${getTranslatedRoute('fields', 'sv', getSlugForEntity(field, 'sv', 'field'))}`,
      }),
    },
  };
}

export default async function FieldPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const hub = resolveTaxonomyHub(universities, slug, locale as 'fi' | 'en' | 'sv', 'field');
  const t = await getTranslations({ locale });

  if (!hub) {
    return (
      <Page.Missing>
        <h1 className="text-2xl font-bold mb-4">{t('fields.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </Page.Missing>
    );
  }

  const { canonical: field, localized: translatedField, rows: fieldData } = hub;
  const universitiesList = Array.from(new Set(fieldData.map((u) => u.oppilaitos)));
  const colors = Array.from(new Set(fieldData.map((u) => u.vari)));
  const areas = Array.from(new Set(fieldData.flatMap((u) => splitCsv(u.alue))));
  const capitalizedField = capitalizeFirstLetter(translatedField);
  const baseUrl = localeSiteBaseUrl(locale);
  const fieldSlug = getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field');

  const credentialSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: capitalizedField,
    description: t('fields.description', {
      count: fieldData.length,
      schoolCount: universitiesList.length,
    }),
    url: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('fields', locale, fieldSlug)}`,
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${capitalizedField} ${t('colors.title').toLowerCase()}`,
    description: t('fields.description', {
      count: fieldData.length,
      schoolCount: universitiesList.length,
    }),
    numberOfItems: fieldData.length,
    itemListElement: fieldData.slice(0, 50).map((uni, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('overall', locale, uni.slug)}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('footer.home'),
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: capitalizedField,
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('fields', locale, fieldSlug)}`,
      },
    ],
  };

  return (
    <>
      <Script
        id={`credential-schema-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(credentialSchema),
        }}
      />
      <Script
        id={`itemlist-schema-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      <Script
        id={`breadcrumb-schema-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
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
              <BreadcrumbLink asChild>
                <Link href={routeHref('fields')}>{t('fields.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{capitalizedField}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">{capitalizedField}</h1>
        <p className="mb-8 max-w-[65ch] text-lg text-muted-foreground">
          {t('fields.description', {
            count: fieldData.length,
            schoolCount: universitiesList.length,
          })}
        </p>

        <RelatedTopics title={t('fields.relatedTopics')}>
          <RelatedTopicsChips>
            {universitiesList.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`university-${item}`}
                item={item}
                locale={locale}
                source="field"
                type="university"
              />
            ))}
            {areas.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`area-${item}`}
                item={item}
                locale={locale}
                source="field"
                type="area"
              />
            ))}
            {colors.slice(0, 5).map((item) => (
              <RelatedTopicsChip
                key={`color-${item}`}
                item={item}
                locale={locale}
                source="field"
                type="color"
              />
            ))}
          </RelatedTopicsChips>
        </RelatedTopics>

        <ul className="space-y-3">
          {fieldData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} source="field" />
          ))}
        </ul>
      </Page>
    </>
  );
}
