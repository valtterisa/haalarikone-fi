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
import { loadColorData } from '@/lib/load-color-data';
import { getUniversitiesByColor } from '@/lib/get-universities-by-criteria';
import { getSlugForEntity, getEntityFromSlug, getEntityTranslation } from '@/lib/slug-translations';
import { parseStyles, capitalizeFirstLetter } from '@/lib/utils';
import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import UniversityCard from '@/components/university-card';
import RelatedTopics, {
  RelatedTopicsChip,
  RelatedTopicsChips,
} from '@/components/related-topic-chips';
import Script from 'next/script';
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
  const uniqueColors = Array.from(
    new Set(universities.flatMap((u) => (u.variBase?.length ? u.variBase : [u.vari]))),
  );

  const params = [];
  for (const locale of routing.locales) {
    for (const color of uniqueColors) {
      params.push({
        locale,
        slug: getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color'),
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale);
  const uniqueColors = Array.from(
    new Set(universities.flatMap((u) => (u.variBase?.length ? u.variBase : [u.vari]))),
  );
  const color = getEntityFromSlug(slug, locale, 'color', uniqueColors);

  if (!color) {
    const t = await getTranslations({ locale, namespace: 'colors' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const colorData = getUniversitiesByColor(universities, color);
  const universitiesList = Array.from(new Set(colorData.map((u) => u.oppilaitos)));

  const t = await getTranslations({ locale });
  const translatedColor = getEntityTranslation(color, locale, 'color');
  const capitalizedColor = capitalizeFirstLetter(translatedColor);
  const baseUrl = localeSiteBaseUrl(locale);
  const colorSlug = getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color');

  return {
    title: `${capitalizedColor} - ${t('colors.title')} | Haalarikone`,
    description: t('colors.description', {
      color: capitalizedColor,
      count: colorData.length,
      schoolCount: universitiesList.length,
    }),
    keywords: [
      `${capitalizedColor} haalari`,
      `${capitalizedColor} haalariväri`,
      `${capitalizedColor} opiskelijahaalari`,
      'haalarivärit',
      'opiskelijahaalarit',
      'suomen opiskelijakulttuuri',
      ...universitiesList.slice(0, 5).map((u) => `${capitalizedColor} ${u}`),
    ],
    openGraph: {
      title: `${capitalizedColor} - ${t('colors.title')} | Haalarikone`,
      description: t('colors.description', {
        color: capitalizedColor,
        count: colorData.length,
        schoolCount: universitiesList.length,
      }),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: `${capitalizedColor} haalari`,
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}${getTranslatedRoute('colors', locale, colorSlug)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${capitalizedColor} - ${t('colors.title')} | Haalarikone`,
      description: t('colors.description', {
        color: capitalizedColor,
        count: colorData.length,
        schoolCount: universitiesList.length,
      }),
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: `${baseUrl}${getTranslatedRoute('colors', locale, colorSlug)}`,
      languages: withXDefault({
        fi: `${localeSiteBaseUrl('fi')}${getTranslatedRoute('colors', 'fi', getSlugForEntity(color, 'fi', 'color'))}`,
        en: `${localeSiteBaseUrl('en')}${getTranslatedRoute('colors', 'en', getSlugForEntity(color, 'en', 'color'))}`,
        sv: `${localeSiteBaseUrl('sv')}${getTranslatedRoute('colors', 'sv', getSlugForEntity(color, 'sv', 'color'))}`,
      }),
    },
  };
}

export default async function ColorPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const colorDataMap = await loadColorData();
  const uniqueColors = Array.from(
    new Set(universities.flatMap((u) => (u.variBase?.length ? u.variBase : [u.vari]))),
  );
  const color = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'color', uniqueColors);
  const t = await getTranslations({ locale });

  if (!color) {
    return (
      <Page.Missing>
        <h1 className="text-2xl font-bold mb-4">{t('colors.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </Page.Missing>
    );
  }

  const colorData = getUniversitiesByColor(universities, color);
  const universitiesList = Array.from(new Set(colorData.map((u) => u.oppilaitos)));
  const fields = Array.from(
    new Set(colorData.flatMap((u) => (u.ala ? u.ala.split(', ') : [])).filter(Boolean)),
  );
  const areas = Array.from(new Set(colorData.flatMap((u) => splitCsv(u.alue))));

  const firstColorData = colorData[0];
  const canonicalHex = colorDataMap.colors[color]?.color ?? null;
  const swatchStyle = canonicalHex
    ? ({ backgroundColor: canonicalHex } as const)
    : parseStyles(firstColorData?.hex || null);
  const translatedColor = getEntityTranslation(color, locale as 'fi' | 'en' | 'sv', 'color');
  const capitalizedColor = capitalizeFirstLetter(translatedColor);
  const baseUrl = localeSiteBaseUrl(locale);
  const colorSlug = getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color');

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
        name: `${capitalizedColor} haalari`,
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('colors', locale, colorSlug)}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${capitalizedColor} ${t('colors.title').toLowerCase()}`,
    description: t('colors.description', {
      color: capitalizedColor,
      count: colorData.length,
      schoolCount: universitiesList.length,
    }),
    numberOfItems: colorData.length,
    itemListElement: colorData.slice(0, 50).map((uni, index) => ({
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
                <Link href={routeHref('colors')}>{t('colors.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{capitalizedColor}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-8 flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg border-2 shadow-md" style={swatchStyle} />
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">{capitalizedColor}</h1>
            <p className="text-lg text-muted-foreground">
              {colorData.length} {t('colors.overallCount')} {universitiesList.length}{' '}
              {t('colors.schoolCount')}
            </p>
          </div>
        </div>

        <RelatedTopics title={t('colors.relatedTopics')}>
          <RelatedTopicsChips>
            {universitiesList.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`university-${item}`}
                item={item}
                locale={locale}
                source="color"
                type="university"
              />
            ))}
            {areas.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`area-${item}`}
                item={item}
                locale={locale}
                source="color"
                type="area"
              />
            ))}
            {fields.slice(0, 10).map((item) => (
              <RelatedTopicsChip
                key={`field-${item}`}
                item={item}
                locale={locale}
                source="color"
                type="field"
              />
            ))}
          </RelatedTopicsChips>
        </RelatedTopics>

        <ul className="space-y-3">
          {colorData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} source="color" />
          ))}
        </ul>
      </Page>
    </>
  );
}
