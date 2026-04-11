import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { loadUniversities } from '@/lib/load-universities';
import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import Script from 'next/script';
import { parseStyles } from '@/lib/utils';
import { getSlugForEntity } from '@/lib/slug-translations';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getTranslatedRoute } from '@/lib/use-translated-routes';
import type { Locale } from '@/lib/slug-translations';

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const universities = await loadUniversities('fi');
  const params = [];
  for (const uni of universities) {
    for (const locale of ['fi', 'en', 'sv'] as const) {
      params.push({
        locale,
        slug: uni.slug,
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as Locale);
  const overall = universities.find((u) => u.slug === slug);

  if (!overall) {
    const t = await getTranslations({ locale, namespace: 'overall' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const t = await getTranslations({ locale });
  const loc = locale as Locale;
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  const path = getTranslatedRoute('overall', loc, overall.slug);

  const keywords = [
    `${overall.vari} haalari`,
    `${overall.oppilaitos} ${t('colors.title').toLowerCase()}`,
    'haalarivärit',
    'opiskelijahaalarit',
    'suomen opiskelijakulttuuri',
  ];

  if (overall.ala) {
    overall.ala.split(', ').forEach((field) => {
      keywords.push(
        `${field} ${t('colors.title').toLowerCase()}`,
        `${overall.oppilaitos} ${field}`,
      );
    });
  }

  if (overall.ainejarjesto) {
    keywords.push(`${overall.ainejarjesto} haalari`);
  }

  return {
    title: `${overall.vari} - ${overall.oppilaitos} | Haalarikone`,
    description: `${overall.vari} haalari ${overall.oppilaitos} ${
      overall.ala ? `- ${overall.ala}` : ''
    } ${overall.ainejarjesto ? `(${overall.ainejarjesto})` : ''}`,
    keywords,
    openGraph: {
      title: `${overall.vari} - ${overall.oppilaitos}`,
      description: `${overall.vari} haalari ${overall.oppilaitos} ${
        overall.ala ? `- ${overall.ala}` : ''
      }`,
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: `${overall.vari} haalari - ${overall.oppilaitos}`,
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}${path}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${overall.vari} - ${overall.oppilaitos} | Haalarikone`,
      description: `${overall.vari} haalari ${overall.oppilaitos}`,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: {
        fi: `https://haalarikone.fi${getTranslatedRoute('overall', 'fi', overall.slug)}`,
        en: `https://haalarikone.fi${getTranslatedRoute('overall', 'en', overall.slug)}`,
        sv: `https://haalarikone.fi${getTranslatedRoute('overall', 'sv', overall.slug)}`,
      },
    },
  };
}

export default async function OverallPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale as Locale);
  const overall = universities.find((u) => u.slug === slug);
  const t = await getTranslations({ locale });
  const loc = locale as Locale;

  if (!overall) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('overall.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }

  const relatedOveralls = universities
    .filter((u) => u.oppilaitos === overall.oppilaitos && u.id !== overall.id)
    .slice(0, 5);

  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  const overallPath = getTranslatedRoute('overall', loc, overall.slug);

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
        name: overall.oppilaitos,
        item: `${baseUrl}/oppilaitos/${getSlugForEntity(overall.oppilaitos, loc, 'university')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${overall.vari} haalari`,
        item: `${baseUrl}${overallPath}`,
      },
    ],
  };

  return (
    <>
      <Script
        id={`breadcrumb-schema-${overall.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
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
              <BreadcrumbLink asChild>
                <Link
                  href={`/oppilaitos/${getSlugForEntity(overall.oppilaitos, loc, 'university')}`}
                >
                  {overall.oppilaitos}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{overall.vari} haalari</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
          <div className="h-28 sm:h-36 relative" style={parseStyles(overall.hex)}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16 relative">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="flex gap-3">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-white shadow-lg flex-shrink-0"
                  style={parseStyles(overall.hex)}
                  title={`${t('overall.color')}: ${overall.vari}`}
                />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-white">
                  <Image
                    className="object-contain p-2"
                    src={`/logos/${
                      overall.oppilaitos.startsWith('Aalto-yliopisto')
                        ? 'Aalto-yliopisto'
                        : overall.oppilaitos
                    }.jpg`}
                    fill
                    alt={`${overall.oppilaitos} logo`}
                  />
                </div>
              </div>

              <div className="flex-1 pt-2 sm:pt-4">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {overall.ainejarjesto ?? overall.oppilaitos}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {overall.ainejarjesto ? overall.oppilaitos : ''}
                </p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 grid gap-5 sm:gap-6">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/vari/${getSlugForEntity(overall.vari, loc, 'color')}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-secondary text-foreground hover:bg-green/15 hover:text-green border border-border/50 hover:border-green/30"
                >
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-black/10"
                    style={parseStyles(overall.hex)}
                  />
                  {overall.vari}
                </Link>
                <Link
                  href={`/oppilaitos/${getSlugForEntity(overall.oppilaitos, loc, 'university')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-secondary text-foreground hover:bg-green/15 hover:text-green border border-border/50 hover:border-green/30"
                >
                  <svg
                    className="w-3.5 h-3.5 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {overall.oppilaitos}
                </Link>
                {overall.alue &&
                  overall.alue.split(', ').map((area) => (
                    <Link
                      key={area}
                      href={`/alue/${getSlugForEntity(area.trim(), loc, 'area')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-secondary text-foreground hover:bg-green/15 hover:text-green border border-border/50 hover:border-green/30"
                    >
                      <svg
                        className="w-3.5 h-3.5 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {area.trim()}
                    </Link>
                  ))}
              </div>

              {overall.ala && (
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('overall.field')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {overall.ala.split(', ').map((field) => (
                      <Link
                        key={field}
                        href={`/ala/${getSlugForEntity(field.trim(), loc, 'field')}`}
                        className="px-3 py-1.5 bg-green/10 text-green rounded-lg text-sm font-medium hover:bg-green/20 transition border border-green/20"
                      >
                        {field.trim()}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedOveralls.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              {t('overall.otherOveralls')} {overall.oppilaitos}
            </h2>
            <div className="grid gap-2.5">
              {relatedOveralls.map((rel) => (
                <Link
                  key={rel.id}
                  href={getTranslatedRoute('overall', loc, rel.slug)}
                  className="group bg-white rounded-xl border border-border/60 hover:border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                >
                  <div className="flex">
                    <div className="flex-shrink-0 w-16 sm:w-20" style={parseStyles(rel.hex)} />
                    <div className="flex-1 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{rel.vari}</h3>
                          {rel.ainejarjesto && (
                            <p className="text-muted-foreground text-sm mt-0.5">
                              {rel.ainejarjesto}
                            </p>
                          )}
                          {rel.ala && !rel.ainejarjesto && (
                            <p className="text-muted-foreground text-sm mt-0.5">{rel.ala}</p>
                          )}
                        </div>
                        <svg
                          className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/*
        <div className="bg-white rounded-xl border border-border/60 p-6 sm:p-8 mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{t('overall.errorTitle')}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{t('overall.errorDescription')}</p>
            </div>
            <FeedbackModal
              triggerLabel={t('overall.errorButton')}
              triggerClassName="bg-green text-white hover:bg-green/90 flex-shrink-0"
              triggerSize="default"
              title={t('overall.errorModalTitle')}
              description={t('overall.errorModalDescription')}
              submitLabel={t('overall.errorSubmit')}
              sourceId={overall.id.toString()}
              sourceName={`${overall.vari} - ${overall.oppilaitos}`}
              messageLabel={t('overall.errorLabel')}
              messagePlaceholder={t('overall.errorPlaceholder')}
            />
          </div>
        </div>
        */}
      </div>
    </>
  );
}
