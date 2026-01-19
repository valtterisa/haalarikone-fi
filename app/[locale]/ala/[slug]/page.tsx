import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { loadUniversities } from "@/lib/load-universities";
import { getUniversitiesByField } from "@/lib/get-universities-by-criteria";
import { getSlugForEntity, getEntityFromSlug, getEntityTranslation } from "@/lib/slug-translations";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import Script from "next/script";
import UniversityCard from "@/components/university-card";
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getTranslatedRoute } from '@/lib/use-translated-routes';

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueFields = Array.from(
    new Set(
      universities
        .flatMap((u) => (u.ala ? u.ala.split(", ") : []))
        .filter(Boolean)
    )
  );

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
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueFields = Array.from(
    new Set(
      universities
        .flatMap((u) => (u.ala ? u.ala.split(", ") : []))
        .filter(Boolean)
    )
  );
  const field = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'field', uniqueFields);

  if (!field) {
    const t = await getTranslations({ locale, namespace: 'fields' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const fieldData = getUniversitiesByField(universities, field);
  const universitiesList = Array.from(
    new Set(fieldData.map((u) => u.oppilaitos))
  );

  const t = await getTranslations({ locale });
  const translatedField = getEntityTranslation(field, locale as 'fi' | 'en' | 'sv', 'field');
  const capitalizedField = capitalizeFirstLetter(translatedField);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  const fieldSlug = getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field');

  return {
    title: `${capitalizedField} - ${t('colors.title')} | Haalarikone`,
    description: t('fields.description', { count: fieldData.length, schoolCount: universitiesList.length }),
    keywords: [
      `${capitalizedField} ${t('colors.title').toLowerCase()}`,
      `${capitalizedField} haalarit`,
      `${capitalizedField} opiskelijahaalarit`,
      "haalarivärit",
      "opiskelijahaalarit",
      "suomen opiskelijakulttuuri",
      ...universitiesList.slice(0, 5).map((u) => `${capitalizedField} ${u}`),
    ],
    openGraph: {
      title: `${capitalizedField} - ${t('colors.title')} | Haalarikone`,
      description: t('fields.description', { count: fieldData.length, schoolCount: universitiesList.length }),
      images: [
        {
          url: "/haalarikone-og.png",
          width: 1200,
          height: 630,
          alt: `${capitalizedField} ${t('colors.title').toLowerCase()}`,
        },
      ],
      type: "website",
      siteName: "Haalarikone",
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}${getTranslatedRoute('fields', locale as 'fi' | 'en' | 'sv', fieldSlug)}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${capitalizedField} - ${t('colors.title')} | Haalarikone`,
      description: t('fields.description', { count: fieldData.length, schoolCount: universitiesList.length }),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `${baseUrl}${getTranslatedRoute('fields', locale as 'fi' | 'en' | 'sv', fieldSlug)}`,
      languages: {
        fi: `https://haalarikone.fi${getTranslatedRoute('fields', 'fi', getSlugForEntity(field, 'fi', 'field'))}`,
        en: `https://haalarikone.fi/en${getTranslatedRoute('fields', 'en', getSlugForEntity(field, 'en', 'field'))}`,
        sv: `https://haalarikone.fi/sv${getTranslatedRoute('fields', 'sv', getSlugForEntity(field, 'sv', 'field'))}`,
      },
    },
  };
}

export default async function FieldPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueFields = Array.from(
    new Set(
      universities
        .flatMap((u) => (u.ala ? u.ala.split(", ") : []))
        .filter(Boolean)
    )
  );
  const field = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'field', uniqueFields);
  const t = await getTranslations({ locale });

  if (!field) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('fields.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }

  const fieldData = getUniversitiesByField(universities, field);
  const universitiesList = Array.from(
    new Set(fieldData.map((u) => u.oppilaitos))
  );
  const colors = Array.from(new Set(fieldData.map((u) => u.vari)));

  const translatedField = getEntityTranslation(field, locale as 'fi' | 'en' | 'sv', 'field');
  const capitalizedField = capitalizeFirstLetter(translatedField);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  const fieldSlug = getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field');

  const credentialSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    credentialCategory: capitalizedField,
    description: t('fields.description', { count: fieldData.length, schoolCount: universitiesList.length }),
    url: `${baseUrl}${getTranslatedRoute('fields', locale as 'fi' | 'en' | 'sv', fieldSlug)}`,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${capitalizedField} ${t('colors.title').toLowerCase()}`,
    description: t('fields.description', { count: fieldData.length, schoolCount: universitiesList.length }),
    numberOfItems: fieldData.length,
    itemListElement: fieldData.slice(0, 50).map((uni, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: `${baseUrl}${getTranslatedRoute('overall', locale as 'fi' | 'en' | 'sv', String(uni.id))}`,
    })),
  };

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
        name: capitalizedField,
        item: `${baseUrl}${getTranslatedRoute('fields', locale as 'fi' | 'en' | 'sv', fieldSlug)}`,
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
                  <Link href={getTranslatedRoute('fields', locale as 'fi' | 'en' | 'sv')}>{t('fields.title')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{capitalizedField}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-4xl font-bold mb-4">{capitalizedField}</h1>
          <p className="text-lg text-gray-700 mb-6">
            {t('fields.description', { count: fieldData.length, schoolCount: universitiesList.length })}.
          </p>
        </div>

        <ul className="space-y-3">
          {fieldData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} />
          ))}
        </ul>

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-4">{t('fields.relatedTopics')}</h2>
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
            {colors.slice(0, 5).map((color) => (
              <Link
                key={color}
                href={getTranslatedRoute('colors', locale as 'fi' | 'en' | 'sv', getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color'))}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {color}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

