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
import { getTranslatedRoute, routeHref, withXDefault } from '@/lib/use-translated-routes';
import type { Locale } from '@/lib/slug-translations';
import { localeSiteBaseUrl } from '@/lib/site-url';
import { getFinnishName } from '@/lib/get-finnish-name';
import { Buildings, CaretRight, GraduationCap, MapPin } from '@phosphor-icons/react/dist/ssr';

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
      languages: withXDefault({
        fi: `${localeSiteBaseUrl('fi')}${getTranslatedRoute('overall', 'fi', overall.slug)}`,
        en: `${localeSiteBaseUrl('en')}${getTranslatedRoute('overall', 'en', overall.slug)}`,
        sv: `${localeSiteBaseUrl('sv')}${getTranslatedRoute('overall', 'sv', overall.slug)}`,
      }),
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

  const logoName = getLogoName(overall.oppilaitos, locale);
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
            <Link
              href={routeHref(
                'colors',
                getSlugForEntity(overall.variBase?.[0] ?? overall.vari, locale, 'color'),
              )}
              className="inline-flex w-fit items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 transition hover:border-green/40 hover:bg-green/5 sm:ml-auto"
            >
              <span
                className="h-6 w-6 rounded-md ring-1 ring-black/15"
                style={parseStyles(overall.hex)}
              />
              <span className="text-sm font-semibold text-foreground">{overall.vari}</span>
            </Link>
          </div>

          <dl className="divide-y divide-border">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-4 sm:px-6">
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
              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-4 sm:px-6">
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
              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[7.5rem_1fr] sm:gap-4 sm:px-6">
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
                    <CaretRight className="h-4 w-4 shrink-0 text-foreground/40 transition group-hover:text-green" weight="regular" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/*
        <div className="bg-card rounded-xl border border-border/60 p-6 sm:p-8 mt-10">
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
