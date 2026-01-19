import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/routing";
import Script from "next/script";
import { Metadata } from "next";
import { loadUniversities } from "@/lib/load-universities";
import { getUniqueFields, getUniqueUniversities } from "@/lib/get-unique-values";
import { getSlugForEntity, getEntityTranslation } from "@/lib/slug-translations";
import { SearchWithDivider } from "@/components/search-with-divider";
import { getTranslations } from 'next-intl/server';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fields' });
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    keywords: [
      "opiskelualat",
      "opiskelu alat",
      "haalarivärit aloittain",
      "tekniikka haalari",
      "kauppatieteet haalari",
      "lääketiede haalari",
      "insinööri haalariväri",
    ],
    openGraph: {
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: [
        {
          url: "/haalarikone-og.png",
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      type: "website",
      siteName: "Haalarikone",
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}/ala`,
    },
    twitter: {
      card: "summary_large_image",
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `${baseUrl}/ala`,
      languages: {
        fi: "https://haalarikone.fi/ala",
        en: "https://haalarikone.fi/en/ala",
        sv: "https://haalarikone.fi/sv/ala",
      },
    },
  };
}

export default async function FieldIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const uniqueFields = getUniqueFields(universities);
  const fieldsWithTranslations = uniqueFields
    .map(field => ({
      finnishName: field,
      translatedName: getEntityTranslation(field, locale as 'fi' | 'en' | 'sv', 'field')
    }))
    .sort((a, b) => a.translatedName.localeCompare(b.translatedName, locale));
  const t = await getTranslations({ locale });
  
  // Calculate counts for description
  const count = universities.length;
  const schoolCount = getUniqueUniversities(universities).length;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t('footer.home'),
        item: locale === 'fi' ? "https://haalarikone.fi" : `https://haalarikone.fi/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t('fields.title'),
        item: locale === 'fi' ? "https://haalarikone.fi/ala" : `https://haalarikone.fi/${locale}/ala`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t('fields.title'),
    description: t('fields.pageDescription'),
    numberOfItems: fieldsWithTranslations.length,
    itemListElement: fieldsWithTranslations.map((field, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: field.translatedName,
      url: locale === 'fi' 
        ? `https://haalarikone.fi/ala/${getSlugForEntity(field.finnishName, 'fi', 'field')}`
        : `https://haalarikone.fi/${locale}/ala/${getSlugForEntity(field.finnishName, locale as 'fi' | 'en' | 'sv', 'field')}`,
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
              <BreadcrumbPage>{t('fields.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold mb-4">{t('fields.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('fields.description', { count, schoolCount })}
        </p>

        <SearchWithDivider section="fields" />

        <div className="grid gap-2 sm:grid-cols-2">
          {fieldsWithTranslations.map((field) => (
            <Link
              key={field.finnishName}
              href={`/ala/${getSlugForEntity(field.finnishName, locale as 'fi' | 'en' | 'sv', 'field')}`}
              className="rounded-lg border px-4 py-3 font-medium text-green hover:bg-green/5"
            >
              {field.translatedName}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

