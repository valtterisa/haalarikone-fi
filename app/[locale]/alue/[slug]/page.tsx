import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { loadUniversities } from "@/lib/load-universities";
import { getUniversitiesByArea } from "@/lib/get-universities-by-criteria";
import { getSlugForEntity, getEntityFromSlug, getEntityTranslation } from "@/lib/slug-translations";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import Script from "next/script";
import UniversityCard from "@/components/university-card";
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueAreas = Array.from(
    new Set(
      universities.flatMap((u) =>
        u.alue ? u.alue.split(', ').map((a) => a.trim()) : []
      )
    )
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
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueAreas = Array.from(
    new Set(
      universities.flatMap((u) =>
        u.alue ? u.alue.split(', ').map((a) => a.trim()) : []
      )
    )
  );
  const area = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'area', uniqueAreas);

  if (!area) {
    const t = await getTranslations({ locale, namespace: 'areas' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const areaData = getUniversitiesByArea(universities, area);
  const universitiesList = Array.from(new Set(areaData.map((u) => u.oppilaitos)));

  const t = await getTranslations({ locale });
  const translatedArea = getEntityTranslation(area, locale as 'fi' | 'en' | 'sv', 'area');
  const capitalizedArea = capitalizeFirstLetter(translatedArea);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;

  return {
    title: `${capitalizedArea} - ${t('colors.title')} | Haalarikone`,
    description: t('areas.description', { area: capitalizedArea, count: areaData.length, schoolCount: universitiesList.length }),
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
      description: t('areas.description', { area: capitalizedArea, count: areaData.length, schoolCount: universitiesList.length }),
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
      url: `${baseUrl}/alue/${getSlugForEntity(area, locale as 'fi' | 'en' | 'sv', 'area')}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedArea} - ${t('colors.title')} | Haalarikone`,
      description: t('areas.description', { area: capitalizedArea, count: areaData.length, schoolCount: universitiesList.length }),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: `${baseUrl}/alue/${getSlugForEntity(area, locale as 'fi' | 'en' | 'sv', 'area')}`,
      languages: {
        fi: `https://haalarikone.fi/alue/${getSlugForEntity(area, 'fi', 'area')}`,
        en: `https://haalarikone.fi/en/alue/${getSlugForEntity(area, 'en', 'area')}`,
        sv: `https://haalarikone.fi/sv/alue/${getSlugForEntity(area, 'sv', 'area')}`,
      },
    },
  };
}

export default async function AreaPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueAreas = Array.from(
    new Set(
      universities.flatMap((u) =>
        u.alue ? u.alue.split(', ').map((a) => a.trim()) : []
      )
    )
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
    new Set(
      areaData.flatMap((u) => (u.ala ? u.ala.split(', ') : [])).filter(Boolean)
    )
  );
  const colors = Array.from(new Set(areaData.map((u) => u.vari)));

  const translatedArea = getEntityTranslation(area, locale as 'fi' | 'en' | 'sv', 'area');
  const capitalizedArea = capitalizeFirstLetter(translatedArea);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;

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
        name: capitalizedArea,
        item: `${baseUrl}/alue/${slug}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${capitalizedArea} ${t('colors.title').toLowerCase()}`,
    description: t('areas.description', { area: capitalizedArea, count: areaData.length, schoolCount: universitiesList.length }),
    numberOfItems: areaData.length,
    itemListElement: areaData.slice(0, 50).map((uni, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: `${baseUrl}/haalari/${uni.id}`,
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{t('footer.home')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{capitalizedArea}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{capitalizedArea}</h1>
          <p className="text-lg text-gray-700 mb-6">
            {t('areas.description', { area: capitalizedArea, count: areaData.length, schoolCount: universitiesList.length })}.
          </p>
        </div>

        <ul className="space-y-3">
          {areaData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} />
          ))}
        </ul>

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-4">{t('areas.relatedTopics')}</h2>
          <div className="flex flex-wrap gap-2">
            {universitiesList.slice(0, 10).map((uni) => (
              <Link
                key={uni}
                href={`/oppilaitos/${getSlugForEntity(uni, locale as 'fi' | 'en' | 'sv', 'university')}`}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {getEntityTranslation(uni, locale as 'fi' | 'en' | 'sv', 'university')}
              </Link>
            ))}
            {fields.slice(0, 10).map((field) => (
              <Link
                key={field}
                href={`/ala/${getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field')}`}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {getEntityTranslation(field, locale as 'fi' | 'en' | 'sv', 'field')}
              </Link>
            ))}
            {colors.slice(0, 5).map((color) => (
              <Link
                key={color}
                href={`/vari/${getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color')}`}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {getEntityTranslation(color, locale as 'fi' | 'en' | 'sv', 'color')}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

