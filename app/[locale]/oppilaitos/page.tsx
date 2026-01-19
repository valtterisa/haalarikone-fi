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
import { getUniqueUniversities } from "@/lib/get-unique-values";
import { getSlugForEntity } from "@/lib/slug-translations";
import { SearchWithDivider } from "@/components/search-with-divider";
import { getTranslations } from 'next-intl/server';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'universities' });
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    keywords: [
      "yliopistot",
      "ammattikorkeakoulut",
      "AMK",
      "suomen yliopistot",
      "oppilaitokset",
      "yliopiston haalarivärit",
      "AMK haalarivärit",
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
      url: `${baseUrl}/oppilaitos`,
    },
    twitter: {
      card: "summary_large_image",
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `${baseUrl}/oppilaitos`,
      languages: {
        fi: "https://haalarikone.fi/oppilaitos",
        en: "https://haalarikone.fi/en/oppilaitos",
        sv: "https://haalarikone.fi/sv/oppilaitos",
      },
    },
  };
}

export default async function UniversityIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const unique = getUniqueUniversities(universities).sort((a, b) =>
    a.localeCompare(b, "fi")
  );
  const t = await getTranslations({ locale });

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
        name: t('universities.title'),
        item: locale === 'fi' ? "https://haalarikone.fi/oppilaitos" : `https://haalarikone.fi/${locale}/oppilaitos`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t('universities.title'),
    description: t('universities.pageDescription'),
    numberOfItems: unique.length,
    itemListElement: unique.map((uni, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: uni,
      url: locale === 'fi' 
        ? `https://haalarikone.fi/oppilaitos/${getSlugForEntity(uni, 'fi', 'university')}`
        : `https://haalarikone.fi/${locale}/oppilaitos/${getSlugForEntity(uni, locale as 'fi' | 'en' | 'sv', 'university')}`,
    })),
  };

  return (
    <>
      <Script
        id="breadcrumb-schema-oppilaitos"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="itemlist-schema-oppilaitos"
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
              <BreadcrumbPage>{t('universities.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold mb-4">{t('universities.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('universities.pageDescription')}
        </p>

        <SearchWithDivider section="universities" />

        <div className="grid gap-2 sm:grid-cols-2">
          {unique.map((uni) => (
            <Link
              key={uni}
              href={`/oppilaitos/${getSlugForEntity(uni, locale as 'fi' | 'en' | 'sv', 'university')}`}
              className="rounded-lg border px-4 py-3 font-medium text-green hover:bg-green/5"
            >
              {uni}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

