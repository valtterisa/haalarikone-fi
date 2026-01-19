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
import { getUniqueColors } from "@/lib/get-unique-values";
import { getSlugForEntity } from "@/lib/slug-translations";
import { SearchWithDivider } from "@/components/search-with-divider";
import { getTranslations } from 'next-intl/server';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'colors' });
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    keywords: [
      "haalarivärit",
      "opiskelijahaalarivärit",
      "haalarivärit 2025",
      "kaikki haalarivärit",
      "opiskelijan haalariväri",
      "yliopiston haalarivärit",
      "AMK haalarivärit",
      "teekkarihaalari värit",
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
      url: `${baseUrl}/vari`,
    },
    twitter: {
      card: "summary_large_image",
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: ["/haalarikone-og.png"],
    },
    alternates: {
      canonical: `${baseUrl}/vari`,
      languages: {
        fi: "https://haalarikone.fi/vari",
        en: "https://haalarikone.fi/en/vari",
        sv: "https://haalarikone.fi/sv/vari",
      },
    },
  };
}

export default async function ColorIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const colors = getUniqueColors(universities).sort((a, b) =>
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
        name: t('colors.title'),
        item: locale === 'fi' ? "https://haalarikone.fi/vari" : `https://haalarikone.fi/${locale}/vari`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t('colors.title'),
    description: t('colors.pageDescription'),
    numberOfItems: colors.length,
    itemListElement: colors.map((color, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: color,
      url: locale === 'fi' 
        ? `https://haalarikone.fi/vari/${getSlugForEntity(color, 'fi', 'color')}`
        : `https://haalarikone.fi/${locale}/vari/${getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color')}`,
    })),
  };

  return (
    <>
      <Script
        id="breadcrumb-schema-vari"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="itemlist-schema-vari"
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
              <BreadcrumbPage>{t('colors.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-4xl font-bold mb-4">{t('colors.title')}</h1>
        <p className="text-lg text-gray-700 mb-8">
          {t('colors.pageDescription')}
        </p>

        <SearchWithDivider section="colors" />

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {colors.map((color) => (
            <Link
              key={color}
              href={`/vari/${getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color')}`}
              className="rounded-lg border px-4 py-3 font-medium text-green hover:bg-green/5 transition"
            >
              {color}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

