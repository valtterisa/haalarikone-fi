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
import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import Script from 'next/script';
import { parseStyles } from '@/lib/utils';
import { getSlugForEntity } from '@/lib/slug-translations';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { routeHref, absoluteUrl } from '@/lib/use-translated-routes';
import type { Locale } from '@/lib/slug-translations';
import { getFinnishName } from '@/lib/get-finnish-name';
import { splitCsv } from '@/lib/popular-destinations';
import { Buildings, CaretRight, GraduationCap, MapPin } from '@phosphor-icons/react/dist/ssr';
import SuggestChangeCard from '@/components/suggest-change-card';
import { EnrichmentProse, EnrichmentWebsiteLink } from '@/components/enrichment-info';
import { getEnrichedOrganization } from '@/lib/load-enrichment';

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
  const overallPageUrl = absoluteUrl(locale, routeHref('overall', overall.slug));
  const enrichment = getEnrichedOrganization(overall.slug);

  const keywords = [
    `${overall.vari} haalari`,
    `${overall.oppilaitos} ${t('colors.title').toLowerCase()}`,
    'haalarivärit',
    'opiskelijahaalarit',
    'suomen opiskelijakulttuuri',
  ];

  if (overall.ala) {
    splitCsv(overall.ala).forEach((field) => {
      keywords.push(
        `${field} ${t('colors.title').toLowerCase()}`,
        `${overall.oppilaitos} ${field}`,
      );
    });
  }

  if (overall.ainejarjesto) {
    keywords.push(`${overall.ainejarjesto} haalari`);
  }

  const fallbackDescription = `${overall.vari} haalari ${overall.oppilaitos} ${
    overall.ala ? `- ${overall.ala}` : ''
  } ${overall.ainejarjesto ? `(${overall.ainejarjesto})` : ''}`.trim();
  const metaDescription = enrichment?.description ?? fallbackDescription;

  return {
    title: `${overall.vari} - ${overall.oppilaitos} | Haalarikone`,
    description: metaDescription,
    keywords,
    openGraph: {
      title: `${overall.vari} - ${overall.oppilaitos}`,
      description: metaDescription,
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
      description: metaDescription,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: overallPageUrl,
      languages: {
        fi: absoluteUrl('fi', routeHref('overall', overall.slug)),
        en: absoluteUrl('en', routeHref('overall', overall.slug)),
        sv: absoluteUrl('sv', routeHref('overall', overall.slug)),
        'x-default': absoluteUrl('fi', routeHref('overall', overall.slug)),
      },
    },
  };
}

function getLogoName(oppilaitos: string, locale: Locale) {
  const finnish = getFinnishName(oppilaitos, locale, 'university');
  return finnish.startsWith('Aalto-yliopisto') ? 'Aalto-yliopisto' : finnish;
}

export default async function OverallPage({ params }: Props) {
  const { locale, slug } = await params;
  const universities = await loadUniversities(locale);
  const overall = universities.find((u) => u.slug === slug);
  const t = await getTranslations({ locale });

  if (!overall) {
    return (
      <Page.Missing>
        <h1 className="text-2xl font-bold mb-4">{t('overall.notFound')}</h1>
        <Link href="/" className="text-green hover:underline">
          {t('common.backToHome')}
        </Link>
      </Page.Missing>
    );
  }

  const relatedOveralls = universities
    .filter((u) => u.oppilaitos === overall.oppilaitos && u.id !== overall.id)
    .slice(0, 5);

  const logoName = getLogoName(overall.oppilaitos, locale);
  const areas = splitCsv(overall.alue);
  const fields = splitCsv(overall.ala);
  const enrichment = getEnrichedOrganization(overall.slug);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('footer.home'),
        item: absoluteUrl(locale, '/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: overall.oppilaitos,
        item: absoluteUrl(
          locale,
          routeHref('universities', getSlugForEntity(overall.oppilaitos, locale, 'university')),
        ),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: overall.ainejarjesto ?? `${overall.vari} haalari`,
        item: absoluteUrl(locale, routeHref('overall', overall.slug)),
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

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div
            className="h-20 w-full border-b border-border sm:h-24"
            style={parseStyles(overall.hex)}
            aria-hidden
          />

          <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
                <Image
                  className="object-contain p-2"
                  src={`/logos/${logoName}.jpg`}
                  fill
                  sizes="56px"
                  alt={`${overall.oppilaitos} logo`}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {overall.ainejarjesto ?? overall.oppilaitos}
                </h1>
                {overall.ainejarjesto && (
                  <p className="mt-0.5 text-sm text-foreground/70">{overall.oppilaitos}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <Link
                href={routeHref(
                  'colors',
                  getSlugForEntity(overall.variBase?.[0] ?? overall.vari, locale, 'color'),
                )}
                className="inline-flex w-fit items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 transition hover:border-green/40 hover:bg-green/5"
              >
                <span
                  className="h-6 w-6 rounded-md ring-1 ring-black/15"
                  style={parseStyles(overall.hex)}
                />
                <span className="text-sm font-semibold text-foreground">{overall.vari}</span>
              </Link>
              {enrichment?.website ? (
                <EnrichmentWebsiteLink
                  href={enrichment.website}
                  label={t('overall.visitWebsite')}
                />
              ) : null}
            </div>
          </div>

          {enrichment?.description ? (
            <div className="border-b border-border px-5 py-5 sm:px-6">
              <h2 className="mb-3 text-sm font-medium text-foreground/55">{t('overall.about')}</h2>
              <EnrichmentProse text={enrichment.description} />
            </div>
          ) : null}

          <dl className="divide-y divide-border">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[7.5rem_1fr] sm:items-center sm:gap-4 sm:px-6">
              <dt className="flex items-center gap-2 text-sm font-medium text-foreground/55">
                <Buildings className="h-4 w-4 text-green" weight="regular" />
                {t('overall.institution')}
              </dt>
              <dd>
                <Link
                  href={routeHref(
                    'universities',
                    getSlugForEntity(overall.oppilaitos, locale, 'university'),
                  )}
                  className="text-sm font-semibold text-foreground underline-offset-4 transition hover:text-green hover:underline"
                >
                  {overall.oppilaitos}
                </Link>
              </dd>
            </div>

            {areas.length > 0 && (
              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[7.5rem_1fr] sm:items-center sm:gap-4 sm:px-6">
                <dt className="flex items-center gap-2 text-sm font-medium text-foreground/55">
                  <MapPin className="h-4 w-4 text-green" weight="regular" />
                  {t('overall.area')}
                </dt>
                <dd className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <Link
                      key={area}
                      href={routeHref('areas', getSlugForEntity(area, locale, 'area'))}
                      className="rounded-md border border-border bg-card px-2.5 py-1 text-sm font-medium text-foreground transition hover:border-green/40 hover:text-green"
                    >
                      {area}
                    </Link>
                  ))}
                </dd>
              </div>
            )}

            {fields.length > 0 && (
              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[7.5rem_1fr] sm:items-center sm:gap-4 sm:px-6">
                <dt className="flex items-center gap-2 text-sm font-medium text-foreground/55">
                  <GraduationCap className="h-4 w-4 text-green" weight="regular" />
                  {t('overall.field')}
                </dt>
                <dd className="flex flex-wrap gap-2">
                  {fields.map((field) => (
                    <Link
                      key={field}
                      href={routeHref('fields', getSlugForEntity(field, locale, 'field'))}
                      className="rounded-md border border-green/30 bg-green/10 px-2.5 py-1 text-sm font-medium text-green transition hover:bg-green/15"
                    >
                      {field}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {relatedOveralls.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-foreground">
              {t('overall.otherOveralls')} · {overall.oppilaitos}
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
              {relatedOveralls.map((rel) => (
                <Link
                  key={rel.id}
                  href={routeHref('overall', rel.slug)}
                  className="group flex border-b border-border last:border-b-0 transition hover:bg-muted/30"
                >
                  <div
                    className="w-20 shrink-0 self-stretch sm:w-24"
                    style={parseStyles(rel.hex)}
                    title={`${t('overall.color')}: ${rel.vari}`}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-card">
                      <Image
                        className="object-contain p-1.5"
                        src={`/logos/${getLogoName(rel.oppilaitos, locale)}.jpg`}
                        fill
                        sizes="40px"
                        alt={`${rel.oppilaitos} logo`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {rel.ainejarjesto ?? rel.vari}
                      </h3>
                      {rel.ainejarjesto ? (
                        <p className="truncate text-sm text-foreground/65">{rel.vari}</p>
                      ) : rel.ala ? (
                        <p className="truncate text-sm text-foreground/65">{rel.ala}</p>
                      ) : null}
                    </div>
                    <CaretRight
                      className="h-4 w-4 shrink-0 text-foreground/40 transition group-hover:text-green"
                      weight="regular"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <SuggestChangeCard
          title={t('overall.errorTitle')}
          description={t('overall.errorDescription')}
          buttonLabel={t('overall.errorButton')}
          modalTitle={t('overall.errorModalTitle')}
          modalDescription={t('overall.errorModalDescription')}
          submitLabel={t('overall.errorSubmit')}
          messageLabel={t('overall.errorLabel')}
          messagePlaceholder={t('overall.errorPlaceholder')}
          sourceId={overall.id.toString()}
          sourceName={[overall.ainejarjesto, overall.vari, overall.oppilaitos]
            .filter(Boolean)
            .join(' · ')}
        />
      </Page>
    </>
  );
}
