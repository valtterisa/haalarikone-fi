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
import { getTranslatedRoute, routeHref } from '@/lib/use-translated-routes';
import type { Locale } from '@/lib/slug-translations';
import { localeSiteBaseUrl } from '@/lib/site-url';
import { Building2, ChevronRight, GraduationCap, MapPin, Palette } from 'lucide-react';

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
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
  const universities = await loadUniversities(locale);
  const overall = universities.find((u) => u.slug === slug);

  if (!overall) {
    const t = await getTranslations({ locale, namespace: 'overall' });
    return {
      title: `${t('notFound')} | Haalarikone`,
    };
  }

  const t = await getTranslations({ locale });
  const baseUrl = localeSiteBaseUrl(locale);
  const overallPageUrl = `${localeSiteBaseUrl(locale)}${getTranslatedRoute('overall', locale, overall.slug)}`;

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
      url: overallPageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${overall.vari} - ${overall.oppilaitos} | Haalarikone`,
      description: `${overall.vari} haalari ${overall.oppilaitos}`,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: overallPageUrl,
      languages: {
        fi: `${localeSiteBaseUrl('fi')}${getTranslatedRoute('overall', 'fi', overall.slug)}`,
        en: `${localeSiteBaseUrl('en')}${getTranslatedRoute('overall', 'en', overall.slug)}`,
        sv: `${localeSiteBaseUrl('sv')}${getTranslatedRoute('overall', 'sv', overall.slug)}`,
      },
    },
  };
}

export default async function OverallPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale);
  const overall = universities.find((u) => u.slug === slug);
  const t = await getTranslations({ locale });

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

  const baseUrl = localeSiteBaseUrl(locale);

  const logoName = overall.oppilaitos.startsWith('Aalto-yliopisto')
    ? 'Aalto-yliopisto'
    : overall.oppilaitos;
  const areas = overall.alue ? overall.alue.split(', ').map((area) => area.trim()) : [];
  const fields = overall.ala ? overall.ala.split(', ').map((field) => field.trim()) : [];

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
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('universities', locale, getSlugForEntity(overall.oppilaitos, locale, 'university'))}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: overall.ainejarjesto ?? `${overall.vari} haalari`,
        item: `${localeSiteBaseUrl(locale)}${getTranslatedRoute('overall', locale, overall.slug)}`,
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
                <Link href={routeHref('universities')}>{t('universities.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={routeHref(
                    'universities',
                    getSlugForEntity(overall.oppilaitos, locale, 'university'),
                  )}
                >
                  {overall.oppilaitos}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{overall.ainejarjesto ?? `${overall.vari} haalari`}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="relative h-28 sm:h-36" style={parseStyles(overall.hex)}>
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/5" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
          </div>

          <div className="relative -mt-10 px-6 pb-8 sm:-mt-12 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] sm:h-20 sm:w-20">
                  <Image
                    className="object-contain p-2.5"
                    src={`/logos/${logoName}.jpg`}
                    fill
                    alt={`${overall.oppilaitos} logo`}
                  />
                </div>
                <div className="min-w-0 pb-1">
                  {overall.ainejarjesto && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t('overall.organization')}
                    </p>
                  )}
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {overall.ainejarjesto ?? overall.oppilaitos}
                  </h1>
                  {overall.ainejarjesto && (
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                      {overall.oppilaitos}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="inline-flex items-center gap-2.5 self-start rounded-full border border-border/60 bg-white px-3.5 py-2 shadow-sm sm:self-auto"
                title={`${t('overall.color')}: ${overall.vari}`}
              >
                <span
                  className="h-5 w-5 rounded-full ring-1 ring-black/10"
                  style={parseStyles(overall.hex)}
                />
                <span className="text-sm font-semibold text-foreground">{overall.vari}</span>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
              <div className="flex items-start gap-3 border-b border-border/40 px-4 py-4 sm:px-5">
                <Palette className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t('overall.color')}
                  </p>
                  <Link
                    href={routeHref(
                      'colors',
                      getSlugForEntity(overall.variBase?.[0] ?? overall.vari, locale, 'color'),
                    )}
                    className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition hover:text-green"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                      style={parseStyles(overall.hex)}
                    />
                    {overall.vari}
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3 border-b border-border/40 px-4 py-4 sm:px-5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t('overall.institution')}
                  </p>
                  <Link
                    href={routeHref(
                      'universities',
                      getSlugForEntity(overall.oppilaitos, locale, 'university'),
                    )}
                    className="mt-1 inline-block text-sm font-semibold text-foreground transition hover:text-green"
                  >
                    {overall.oppilaitos}
                  </Link>
                </div>
              </div>

              {areas.length > 0 && (
                <div className="flex items-start gap-3 border-b border-border/40 px-4 py-4 sm:px-5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t('overall.area')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {areas.map((area) => (
                        <Link
                          key={area}
                          href={routeHref('areas', getSlugForEntity(area, locale, 'area'))}
                          className="rounded-full border border-border/60 bg-white px-3 py-1 text-sm font-medium text-foreground transition hover:border-green/30 hover:bg-green/5 hover:text-green"
                        >
                          {area}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {fields.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t('overall.field')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fields.map((field) => (
                        <Link
                          key={field}
                          href={routeHref('fields', getSlugForEntity(field, locale, 'field'))}
                          className="rounded-full border border-green/20 bg-green/10 px-3 py-1 text-sm font-medium text-green transition hover:bg-green/15"
                        >
                          {field}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedOveralls.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t('overall.otherOveralls')}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{overall.oppilaitos}</h2>
              </div>
            </div>
            <div className="grid gap-3">
              {relatedOveralls.map((rel) => (
                <Link
                  key={rel.id}
                  href={routeHref('overall', rel.slug)}
                  className="group overflow-hidden rounded-xl border border-border/60 bg-white transition-all duration-300 hover:border-green/20 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex">
                    <div
                      className="w-16 shrink-0 sm:w-20"
                      style={parseStyles(rel.hex)}
                      title={`${t('overall.color')}: ${rel.vari}`}
                    />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3.5">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">
                          {rel.ainejarjesto ?? rel.vari}
                        </h3>
                        {rel.ainejarjesto ? (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {rel.vari}
                          </p>
                        ) : rel.ala ? (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">{rel.ala}</p>
                        ) : null}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
