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
import { joinNames, splitCsv } from '@/lib/popular-destinations';

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: 'fi' | 'en' | 'sv'; slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueUniversities = getTaxonomyEntities(universities, 'university');

  const params = [];
  for (const locale of routing.locales) {
    for (const uni of uniqueUniversities) {
      params.push({
        locale,
        slug: getSlugForEntity(uni, locale as 'fi' | 'en' | 'sv', 'university'),
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale);
  const hub = resolveTaxonomyHub(universities, slug, locale, 'university');

  if (!hub) {
    const t = await getTranslations({ locale, namespace: 'universities' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const { canonical: university, localized: translatedUniversity, rows: universityData } = hub;
  const fields = Array.from(new Set(universityData.flatMap((u) => splitCsv(u.ala))));

  const t = await getTranslations({ locale });
  const capitalizedUniversity = capitalizeFirstLetter(translatedUniversity);
  const baseUrl = localeSiteBaseUrl(locale);
  const universitySlug = getSlugForEntity(university, locale, 'university');

  return {
    title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
    description: t('universities.description', {
      university: capitalizedUniversity,
      count: universityData.length,
    }),
    keywords: [
      `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
      `${capitalizedUniversity} haalarit`,
      `${capitalizedUniversity} opiskelijahaalarit`,
      'haalarivärit',
      'opiskelijahaalarit',
      'suomen opiskelijakulttuuri',
      ...fields.slice(0, 5).map((f) => `${capitalizedUniversity} ${f}`),
    ],
    openGraph: {
      title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
      description: t('universities.description', {
        university: capitalizedUniversity,
        count: universityData.length,
      }),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('universities', locale, universitySlug)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
      description: t('universities.description', {
        university: capitalizedUniversity,
        count: universityData.length,
      }),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('universities', locale, universitySlug)}`,
      languages: withXDefault({
        fi: `${localeSiteBaseUrl('fi')}${getTranslatedRoute('universities', 'fi', getSlugForEntity(university, 'fi', 'university'))}`,
        en: `${localeSiteBaseUrl('en')}${getTranslatedRoute('universities', 'en', getSlugForEntity(university, 'en', 'university'))}`,
        sv: `${localeSiteBaseUrl('sv')}${getTranslatedRoute('universities', 'sv', getSlugForEntity(university, 'sv', 'university'))}`,
      }),
    },
  };
}

export default async function UniversityPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const hub = resolveTaxonomyHub(universities, slug, locale as 'fi' | 'en' | 'sv', 'university');
  const t = await getTranslations({ locale });

  if (!hub) {
    return (
      <Page.Missing>
        <h1 className="text-2xl font-bold mb-4">{t('universities.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </Page.Missing>
    );
  }

  const { canonical: university, localized: translatedUniversity, rows: universityData } = hub;
  const fields = Array.from(
    new Set(universityData.flatMap((u) => splitCsv(u.ala)).filter(Boolean)),
  );
  const colors = Array.from(new Set(universityData.map((u) => u.vari)));
  const areas = Array.from(new Set(universityData.flatMap((u) => splitCsv(u.alue))));
  const capitalizedUniversity = capitalizeFirstLetter(translatedUniversity);
  const baseUrl = localeSiteBaseUrl(locale);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: capitalizedUniversity,
    description: t('universities.description', {
      university: capitalizedUniversity,
      count: universityData.length,
    }),
    url: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('universities', locale, getSlugForEntity(university, locale, 'university'))}`,
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
    description: t('universities.description', {
      university: capitalizedUniversity,
      count: universityData.length,
    }),
    numberOfItems: universityData.length,
    itemListElement: universityData.slice(0, 50).map((uni, index) => ({
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
        name: t('universities.title'),
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('universities', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: capitalizedUniversity,
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('universities', locale, slug)}`,
      },
    ],
  };

  return (
    <>
      <Script
        id={`organization-schema-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
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
                <Link href={routeHref('universities')}>{t('universities.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{capitalizedUniversity}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">
          {capitalizedUniversity}
        </h1>
        <p className="mb-8 max-w-[65ch] text-lg text-muted-foreground">
          {t('universities.intro', {
            university: capitalizedUniversity,
            count: universityData.length,
            colors: joinNames(colors),
            areas: joinNames(areas),
          })}
        </p>

        <RelatedTopics title={t('universities.relatedTopics')}>
          <RelatedTopicsChips>
            {areas.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`area-${item}`}
                item={item}
                locale={locale}
                source="university"
                type="area"
              />
            ))}
            {fields.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`field-${item}`}
                item={item}
                locale={locale}
                source="university"
                type="field"
              />
            ))}
            {colors.slice(0, 5).map((item) => (
              <RelatedTopicsChip
                key={`color-${item}`}
                item={item}
                locale={locale}
                source="university"
                type="color"
              />
            ))}
          </RelatedTopicsChips>
        </RelatedTopics>

        <ul className="space-y-3">
          {universityData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} source="university" />
          ))}
        </ul>
      </Page>
    </>
  );
}
