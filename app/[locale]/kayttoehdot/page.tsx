import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/slug-translations';
import type { Metadata } from 'next';
import Script from 'next/script';
import {
  LegalDocument,
  parseLegalFacts,
  parseLegalSections,
} from '@/components/legal-document';
import { SITE_ORIGIN } from '@/lib/site-url';
import { absoluteHomeUrl } from '@/lib/use-translated-routes';
import { absoluteLegalUrl, legalLanguageUrls } from '@/lib/legal-urls';

const HREF = '/kayttoehdot' as const;

export function generateStaticParams() {
  return ['fi', 'en', 'sv'].map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const url = absoluteLegalUrl(HREF, locale);

  return {
    title: t('terms.pageTitle'),
    description: t('terms.description'),
    openGraph: {
      title: t('terms.pageTitle'),
      description: t('terms.description'),
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url,
    },
    alternates: {
      canonical: url,
      languages: legalLanguageUrls(HREF),
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const pageUrl = absoluteLegalUrl(HREF, locale);

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('legal.terms.title'),
    description: t('legal.terms.description'),
    url: pageUrl,
    dateModified: '2026-08-17',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Haalarikone',
      url: SITE_ORIGIN,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('footer.home'),
        item: absoluteHomeUrl(locale),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('legal.terms.title'),
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Script
        id="webpage-schema-terms"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Script
        id="breadcrumb-schema-terms"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LegalDocument
        homeLabel={t('footer.home')}
        title={t('legal.terms.title')}
        updatedLabel={t('legal.updatedLabel')}
        updatedDate={t('legal.updatedDate')}
        intro={t('legal.terms.intro')}
        facts={parseLegalFacts(t.raw('legal.terms.facts'))}
        sections={parseLegalSections(t.raw('legal.terms.sections'))}
      />
    </>
  );
}
