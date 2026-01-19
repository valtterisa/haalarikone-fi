import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { loadUniversities } from "@/lib/load-universities";
import { getUniversitiesByUniversity } from "@/lib/get-universities-by-criteria";
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

export const dynamicParams = false;

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const uniqueUniversities = Array.from(
    new Set(universities.map((u) => u.oppilaitos))
  );

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
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueUniversities = Array.from(
    new Set(universities.map((u) => u.oppilaitos))
  );
  const university = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'university', uniqueUniversities);

  if (!university) {
    const t = await getTranslations({ locale, namespace: 'universities' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const universityData = getUniversitiesByUniversity(universities, university);
  const fields = Array.from(
    new Set(
      universityData
        .flatMap((u) => (u.ala ? u.ala.split(", ") : []))
        .filter(Boolean)
    )
  );

  const t = await getTranslations({ locale });
  const translatedUniversity = getEntityTranslation(university, locale as 'fi' | 'en' | 'sv', 'university');
  const capitalizedUniversity = capitalizeFirstLetter(translatedUniversity);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;

  return {
    title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
    description: t('universities.description', { university: capitalizedUniversity, count: universityData.length }),
    keywords: [
      `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
      `${capitalizedUniversity} haalarit`,
      `${capitalizedUniversity} opiskelijahaalarit`,
      "haalarivärit",
      "opiskelijahaalarit",
      "suomen opiskelijakulttuuri",
      ...fields.slice(0, 5).map((f) => `${capitalizedUniversity} ${f}`),
    ],
    openGraph: {
      title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
      description: t('universities.description', { university: capitalizedUniversity, count: universityData.length }),
      images: [
        {
          url: "/haalarikone-og.png",
          width: 1200,
          height: 630,
          alt: `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
        },
      ],
      type: "website",
      siteName: "Haalarikone",
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}/oppilaitos/${getSlugForEntity(university, locale as 'fi' | 'en' | 'sv', 'university')}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${capitalizedUniversity} - ${t('colors.title')} | Haalarikone`,
      description: t('universities.description', { university: capitalizedUniversity, count: universityData.length }),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `${baseUrl}/oppilaitos/${getSlugForEntity(university, locale as 'fi' | 'en' | 'sv', 'university')}`,
      languages: {
        fi: `https://haalarikone.fi/oppilaitos/${getSlugForEntity(university, 'fi', 'university')}`,
        en: `https://haalarikone.fi/en/oppilaitos/${getSlugForEntity(university, 'en', 'university')}`,
        sv: `https://haalarikone.fi/sv/oppilaitos/${getSlugForEntity(university, 'sv', 'university')}`,
      },
    },
  };
}

export default async function UniversityPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueUniversities = Array.from(
    new Set(universities.map((u) => u.oppilaitos))
  );
  const university = getEntityFromSlug(slug, locale as 'fi' | 'en' | 'sv', 'university', uniqueUniversities);
  const t = await getTranslations({ locale });

  if (!university) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('universities.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }

  const universityData = getUniversitiesByUniversity(universities, university);
  const fields = Array.from(
    new Set(
      universityData
        .flatMap((u) => (u.ala ? u.ala.split(", ") : []))
        .filter(Boolean)
    )
  );
  const colors = Array.from(new Set(universityData.map((u) => u.vari)));

  const translatedUniversity = getEntityTranslation(university, locale as 'fi' | 'en' | 'sv', 'university');
  const capitalizedUniversity = capitalizeFirstLetter(translatedUniversity);
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: capitalizedUniversity,
    description: t('universities.description', { university: capitalizedUniversity, count: universityData.length }),
    url: `${baseUrl}/oppilaitos/${getSlugForEntity(university, locale as 'fi' | 'en' | 'sv', 'university')}`,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${capitalizedUniversity} ${t('colors.title').toLowerCase()}`,
    description: t('universities.description', { university: capitalizedUniversity, count: universityData.length }),
    numberOfItems: universityData.length,
    itemListElement: universityData.slice(0, 50).map((uni, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: `${baseUrl}/haalari/${uni.id}`,
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
        name: capitalizedUniversity,
        item: `${baseUrl}/oppilaitos/${slug}`,
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
              <BreadcrumbLink asChild>
                <Link href="/oppilaitos">{t('universities.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{capitalizedUniversity}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{capitalizedUniversity}</h1>
          <p className="text-lg text-gray-700 mb-6">
            {t('universities.description', { university: capitalizedUniversity, count: universityData.length })}.
          </p>
        </div>

        <ul className="space-y-3">
          {universityData.map((uni) => (
            <UniversityCard key={uni.id} uni={uni} />
          ))}
        </ul>

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-4">{t('universities.relatedTopics')}</h2>
          <div className="flex flex-wrap gap-2">
            {fields.slice(0, 10).map((field) => (
              <Link
                key={field}
                href={`/ala/${getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field')}`}
                className="px-4 py-2 bg-green/10 text-green rounded hover:bg-green/20 transition"
              >
                {field}
              </Link>
            ))}
            {colors.slice(0, 5).map((color) => (
              <Link
                key={color}
                href={`/vari/${getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color')}`}
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

