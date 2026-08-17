import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { loadUniversities } from '@/lib/load-universities';
import { getUniversitiesByArea } from '@/lib/get-universities-by-criteria';
import { getSlugForEntity, getEntityFromSlug, getEntityTranslation } from '@/lib/slug-translations';
import { capitalizeFirstLetter } from '@/lib/utils';
import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import Script from 'next/script';
import UniversityCard from '@/components/university-card';
import RelatedTopics from '@/components/related-topic-chips';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTranslatedRoute, routeHref, withXDefault } from '@/lib/use-translated-routes';
import { localeSiteBaseUrl } from '@/lib/site-url';
import { joinNames, splitCsv } from '@/lib/popular-destinations';

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: 'fi' | 'en' | 'sv'; slug: string }>;
};

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueAreas = Array.from(
    new Set(universities.flatMap((u) => (u.alue ? u.alue.split(', ').map((a) => a.trim()) : []))),
  );

  const params = [];
  for (const locale of routing.locales) {
    for (const area of uniqueAreas) {
      params.push({
        locale,
        slug: getSlugForEntity(area, locale as 'fi' | 'en' | 'sv', 'area'),
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale);
  const uniqueAreas = Array.from(
    new Set(universities.flatMap((u) => (u.alue ? u.alue.split(', ').map((a) => a.trim()) : []))),
  );
  const area = getEntityFromSlug(slug, locale, 'area', uniqueAreas);

  if (!area) {
    const t = await getTranslations({ locale, namespace: 'areas' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const areaData = getUniversitiesByArea(universities, area);
  const universitiesList = Array.from(new Set(areaData.map((u) => u.oppilaitos)));

  const t = await getTranslations({ locale });
  const translatedArea = getEntityTranslation(area, locale, 'area');
  const capitalizedArea = capitalizeFirstLetter(translatedArea);
  const baseUrl = localeSiteBaseUrl(locale);
  const areaSlug = getSlugForEntity(area, locale, 'area');

  return {
    title: `${capitalizedArea} - ${t('colors.title')} | Haalarikone`,
    description: t('areas.description', {
      area: capitalizedArea,
      count: areaData.length,
      schoolCount: universitiesList.length,
    }),
    keywords: [
      `${capitalizedArea} ${t('colors.title').toLowerCase()}`,
      `${capitalizedArea} haalarit`,
      `${capitalizedArea} opiskelijahaalarit`,
      'haalarivärit',
      'opiskelijahaalarit',
      'suomen opiskelijakulttuuri',
      ...universitiesList.slice(0, 5).map((u) => `${capitalizedArea} ${u}`),
    ],
    openGraph: {
      title: `${capitalizedArea} - ${t('colors.title')} | Haalarikone`,
      description: t('areas.description', {
        area: capitalizedArea,
        count: areaData.length,
        schoolCount: universitiesList.length,
      }),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: `${capitalizedArea} ${t('colors.title').toLowerCase()}`,
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('areas', locale, areaSlug)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedArea} - ${t('colors.title')} | Haalarikone`,
      description: t('areas.description', {
        area: capitalizedArea,
        count: areaData.length,
        schoolCount: universitiesList.length,
      }),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('areas', locale, areaSlug)}`,
      languages: withXDefault({
        fi: `${localeSiteBaseUrl('fi')}${getTranslatedRoute('areas', 'fi', getSlugForEntity(area, 'fi', 'area'))}`,
        en: `${localeSiteBaseUrl('en')}${getTranslatedRoute('areas', 'en', getSlugForEntity(area, 'en', 'area'))}`,
        sv: `${localeSiteBaseUrl('sv')}${getTranslatedRoute('areas', 'sv', getSlugForEntity(area, 'sv', 'area'))}`,
      }),
    },
  };
}

export default async function AreaPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueAreas = Array.from(
    new Set(universities.flatMap((u) => (u.alue ? u.alue.split(', ').map((a) => a.trim()) : []))),
  );
  const area = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'area', uniqueAreas);
  const t = await getTranslations({ locale });

  if (!area) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('areas.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }

  const areaData = getUniversitiesByArea(universities, area);
  const universitiesList = Array.from(new Set(areaData.map((u) => u.oppilaitos)));
  const fields = Array.from(
    new Set(areaData.flatMap((u) => splitCsv(u.ala)).filter(Boolean)),
  );
  const colors = Array.from(new Set(areaData.map((u) => u.vari)));

  const translatedArea = getEntityTranslation(area, locale as 'fi' | 'en' | 'sv', 'area');
  const capitalizedArea = capitalizeFirstLetter(translatedArea);
  const baseUrl = localeSiteBaseUrl(locale);

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
        name: t('areas.title'),
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('areas', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: capitalizedArea,
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('areas', locale, slug)}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${capitalizedArea} ${t('colors.title').toLowerCase()}`,
    description: t('areas.description', {
      area: capitalizedArea,
      count: areaData.length,
      schoolCount: universitiesList.length,
    }),
    numberOfItems: areaData.length,
    itemListElement: areaData.slice(0, 50).map((uni, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('overall', locale, uni.slug)}`,
    })),
  };

  return (
    <>
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
      <div className="container mx-auto px-4 py-8 sm:py-16 max-w-4xl">
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
                <Link href={routeHref('areas')}>{t('areas.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{capitalizedArea}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-4">{capitalizedArea}</h1>
          <p className="text-lg text-gray-700">
            {t('areas.intro', {
              area: capitalizedArea,
              count: areaData.length,
              schoolCount: universitiesList.length,
              schools: joinNames(universitiesList),
            })}
          </p>
        </div>

        <RelatedTopics title={t('areas.relatedTopics')}>
          <RelatedTopics.Chips>
            {universitiesList.slice(0, 10).map((item) => (
              <RelatedTopics.Chip
                key={`university-${item}`}
                item={item}
                locale={locale}
                source="area"
                type="university"
              />
            ))}
            {fields.slice(0, 10).map((item) => (
              <RelatedTopics.Chip
                key={`field-${item}`}
                item={item}
                locale={locale}
                source="area"
                type="field"
              />
            ))}
            {colors.slice(0, 5).map((item) => (
              <RelatedTopics.Chip
                key={`color-${item}`}
                item={item}
                locale={locale}
                source="area"
                type="color"
              />
            ))}
          </RelatedTopics.Chips>
        </RelatedTopics>

        <ul className="space-y-3">
          {areaData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} source="area" />
          ))}
        </ul>
      </div>
    </>
  );
}
