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
import { routeHref, absoluteUrl } from '@/lib/use-translated-routes';
import { joinNames, splitCsv } from '@/lib/popular-destinations';
import SuggestChangeCard from '@/components/suggest-change-card';
import { UniversityProfile } from '@/components/university-profile';
import { getEnrichedSchool } from '@/lib/load-enrichment';

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
  const universitySlug = getSlugForEntity(university, locale, 'university');
  const pageUrl = absoluteUrl(locale, routeHref('universities', universitySlug));
  const enrichment = getEnrichedSchool(university);
  const metaDescription =
    enrichment?.description ??
    t('universities.description', {
      university: capitalizedUniversity,
      count: universityData.length,
    });

  return {
    title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
    description: metaDescription,
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
      description: metaDescription,
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
      url: pageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
      description: metaDescription,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        fi: absoluteUrl(
          'fi',
          routeHref('universities', getSlugForEntity(university, 'fi', 'university')),
        ),
        en: absoluteUrl(
          'en',
          routeHref('universities', getSlugForEntity(university, 'en', 'university')),
        ),
        sv: absoluteUrl(
          'sv',
          routeHref('universities', getSlugForEntity(university, 'sv', 'university')),
        ),
        'x-default': absoluteUrl(
          'fi',
          routeHref('universities', getSlugForEntity(university, 'fi', 'university')),
        ),
      },
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
  const universitySlug = getSlugForEntity(university, locale, 'university');
  const enrichment = getEnrichedSchool(university);
  const logoName = university.startsWith('Aalto-yliopisto') ? 'Aalto-yliopisto' : university;
  const introText =
    enrichment?.description ??
    t('universities.intro', {
      university: capitalizedUniversity,
      count: universityData.length,
      colors: joinNames(colors),
      areas: joinNames(areas),
    });
  const schemaDescription =
    enrichment?.description ??
    t('universities.description', {
      university: capitalizedUniversity,
      count: universityData.length,
    });

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: capitalizedUniversity,
    description: schemaDescription,
    url: absoluteUrl(
      locale,
      routeHref('universities', getSlugForEntity(university, locale, 'university')),
    ),
    ...(enrichment?.website ? { sameAs: [enrichment.website] } : {}),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
    description: schemaDescription,
    numberOfItems: universityData.length,
    itemListElement: universityData.slice(0, 50).map((uni, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: absoluteUrl(locale, routeHref('overall', uni.slug)),
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
        item: absoluteUrl(locale, '/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('universities.title'),
        item: absoluteUrl(locale, routeHref('universities')),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: capitalizedUniversity,
        item: absoluteUrl(locale, routeHref('universities', slug)),
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
        <UniversityProfile
          name={capitalizedUniversity}
          logoName={logoName}
          description={introText}
          overallCount={universityData.length}
          overallCountLabel={t('universities.overallCount')}
          areas={areas}
          enrichment={enrichment}
          websiteLabel={t('universities.visitWebsite')}
          studentUnionLabel={t('universities.studentUnion')}
        />

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

        <SuggestChangeCard
          title={t('overall.errorTitle')}
          description={t('overall.errorDescription')}
          buttonLabel={t('overall.errorButton')}
          modalTitle={t('overall.errorModalTitle')}
          modalDescription={t('overall.errorModalDescription')}
          submitLabel={t('overall.errorSubmit')}
          messageLabel={t('overall.errorLabel')}
          messagePlaceholder={t('overall.errorPlaceholder')}
          sourceId={universitySlug}
          sourceName={capitalizedUniversity}
        />
      </Page>
    </>
  );
}
