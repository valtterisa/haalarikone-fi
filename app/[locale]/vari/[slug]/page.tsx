import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { loadUniversities } from "@/lib/load-universities";
import { getUniversitiesByColor } from "@/lib/get-universities-by-criteria";
import { getSlugForEntity, getEntityFromSlug, getEntityTranslation } from "@/lib/slug-translations";
import { parseStyles, capitalizeFirstLetter } from "@/lib/utils";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import UniversityCard from "@/components/university-card";
import Script from "next/script";
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTranslatedRoute } from '@/lib/use-translated-routes';

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueColors = Array.from(new Set(universities.map((u) => u.vari)));

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
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueColors = Array.from(new Set(universities.map((u) => u.vari)));
  const color = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'color', uniqueColors);

  if (!color) {
    const t = await getTranslations({ locale, namespace: 'colors' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const colorData = getUniversitiesByColor(universities, color);
  const universitiesList = Array.from(
    new Set(colorData.map((u) => u.oppilaitos))
  );

  const t = await getTranslations({ locale });
  const translatedColor = getEntityTranslation(color, locale as 'fi' | 'en' | 'sv', 'color');
  const capitalizedColor = capitalizeFirstLetter(translatedColor);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  const colorSlug = getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color');

  return {
    title: `${capitalizedColor} - ${t('colors.title')} | Haalarikone`,
    description: t('colors.description', { color: capitalizedColor, count: colorData.length, schoolCount: universitiesList.length }),
    keywords: [
      `${capitalizedColor} haalari`,
      `${capitalizedColor} haalariväri`,
      `${capitalizedColor} opiskelijahaalari`,
      "haalarivärit",
      "opiskelijahaalarit",
      "suomen opiskelijakulttuuri",
      ...universitiesList.slice(0, 5).map((u) => `${capitalizedColor} ${u}`),
    ],
    openGraph: {
      title: `${capitalizedColor} - ${t('colors.title')} | Haalarikone`,
      description: t('colors.description', { color: capitalizedColor, count: colorData.length, schoolCount: universitiesList.length }),
      images: [
        {
          url: "/haalarikone-og.png",
          width: 1200,
          height: 630,
          alt: `${capitalizedColor} haalari`,
        },
      ],
      type: "website",
      siteName: "Haalarikone",
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}${getTranslatedRoute('colors', locale as 'fi' | 'en' | 'sv', colorSlug)}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${capitalizedColor} - ${t('colors.title')} | Haalarikone`,
      description: t('colors.description', { color: capitalizedColor, count: colorData.length, schoolCount: universitiesList.length }),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `${baseUrl}${getTranslatedRoute('colors', locale as 'fi' | 'en' | 'sv', colorSlug)}`,
      languages: {
        fi: `https://haalarikone.fi${getTranslatedRoute('colors', 'fi', getSlugForEntity(color, 'fi', 'color'))}`,
        en: `https://haalarikone.fi/en${getTranslatedRoute('colors', 'en', getSlugForEntity(color, 'en', 'color'))}`,
        sv: `https://haalarikone.fi/sv${getTranslatedRoute('colors', 'sv', getSlugForEntity(color, 'sv', 'color'))}`,
      },
    },
  };
}

export default async function ColorPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueColors = Array.from(new Set(universities.map((u) => u.vari)));
  const color = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'color', uniqueColors);
  const t = await getTranslations({ locale });

  if (!color) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('colors.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }

  const colorData = getUniversitiesByColor(universities, color);
  const universitiesList = Array.from(
    new Set(colorData.map((u) => u.oppilaitos))
  );
  const fields = Array.from(
    new Set(
      colorData.flatMap((u) => (u.ala ? u.ala.split(", ") : [])).filter(Boolean)
    )
  );

  const firstColorData = colorData[0];
  const translatedColor = getEntityTranslation(color, locale as 'fi' | 'en' | 'sv', 'color');
  const capitalizedColor = capitalizeFirstLetter(translatedColor);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  const colorSlug = getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color');

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t('footer.home'),
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${capitalizedColor} haalari`,
        item: `${baseUrl}${getTranslatedRoute('colors', locale as 'fi' | 'en' | 'sv', colorSlug)}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${capitalizedColor} ${t('colors.title').toLowerCase()}`,
    description: t('colors.description', { color: capitalizedColor, count: colorData.length, schoolCount: universitiesList.length }),
    numberOfItems: colorData.length,
    itemListElement: colorData.slice(0, 50).map((uni, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: `${baseUrl}${getTranslatedRoute('overall', locale as 'fi' | 'en' | 'sv', String(uni.id))}`,
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
        <div className="mb-8">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">{t('footer.home')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={getTranslatedRoute('colors', locale as 'fi' | 'en' | 'sv')}>{t('colors.title')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{capitalizedColor}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-lg border-2 shadow-md"
              style={parseStyles(firstColorData?.hex || null)}
            />
            <div>
              <h1 className="text-4xl font-bold">{capitalizedColor}</h1>
              <p className="text-lg text-gray-700">
                {t('colors.overallCount', { count: colorData.length })} {t('colors.schoolCount', { count: universitiesList.length })}
              </p>
            </div>
          </div>
        </div>

        <ul className="space-y-3">
          {colorData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} />
          ))}
        </ul>

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-4">{t('colors.relatedTopics')}</h2>
          <div className="flex flex-wrap gap-2">
            {universitiesList.slice(0, 10).map((uni) => (
              <Link
                key={uni}
                href={getTranslatedRoute('universities', locale as 'fi' | 'en' | 'sv', getSlugForEntity(uni, locale as 'fi' | 'en' | 'sv', 'university'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {uni}
              </Link>
            ))}
            {fields.slice(0, 10).map((field) => (
              <Link
                key={field}
                href={getTranslatedRoute('fields', locale as 'fi' | 'en' | 'sv', getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {field}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

