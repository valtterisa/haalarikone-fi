import SearchContainer from '@/components/search-container';
import { loadUniversities } from '@/lib/load-universities';
import { loadColorData } from '@/lib/load-color-data';
import FAQSchema from '@/components/faq-schema';
import FaqList, { FaqItem } from '@/components/faq-list';
import { NavigateCard } from '@/components/navigate-card';
import PopularDestinations from '@/components/popular-destinations';
import Script from 'next/script';
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/routing';
import { entitySlug } from '@/lib/entity-slug';
import { getLocalizedName } from '@/lib/get-finnish-name';
import { POPULAR_AREAS, POPULAR_SCHOOLS } from '@/lib/popular-destinations';
import { SITE_ORIGIN } from '@/lib/site-url';
import type { Locale } from '@/lib/slug-translations';
import { routeHref } from '@/lib/use-translated-routes';
import { capitalizeFirstLetter } from '@/lib/utils';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('defaultTitle'),
    description: t('defaultDescription'),
  };
}

export default async function Index({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { locale } = await params;
  const { search } = await searchParams;
  const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
  const colorData = await loadColorData();
  const t = await getTranslations({ locale });
  const loc = locale as Locale;
  const homeUrl = `${SITE_ORIGIN}${getPathname({ locale: loc, href: '/' })}`;
  const atmosphereHexes = Object.values(colorData.colors)
    .map((entry) => entry.color)
    .filter(Boolean);

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('meta.siteName'),
    url: homeUrl,
    description: t('home.description'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${homeUrl}?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: t('meta.siteName'),
    url: SITE_ORIGIN,
    description: t('home.description'),
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_ORIGIN}/haalarikone-og.png`,
      width: 1200,
      height: 630,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: locale === 'fi' ? 'Finnish' : locale === 'en' ? 'English' : 'Swedish',
    },
    sameAs: [],
  };

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <FAQSchema locale={locale} />
      <div className="flex w-full flex-col items-center bg-background">
        <div className="flex w-full max-w-4xl flex-col px-4 pt-8 pb-3 sm:pt-12 sm:pb-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('home.title')}
          </h1>
          <p className="mt-2 max-w-[40ch] text-base text-muted-foreground">{t('home.tagline')}</p>
        </div>
        <SearchContainer
          initialUniversities={universities}
          colorData={colorData}
          showResultsByDefault
          showIdlePlaceholder
          initialTextSearch={search}
          resultSource="home"
          belowForm={
            <PopularDestinations title={t('popular.title')}>
              <PopularDestinations.Group label={t('popular.areas')}>
                {POPULAR_AREAS.map((area) => {
                  const slug = entitySlug(area, loc, 'area');
                  return (
                    <PopularDestinations.Chip
                      key={area}
                      href={routeHref('areas', slug)}
                      source="home"
                      type="area"
                      slug={slug}
                    >
                      {capitalizeFirstLetter(getLocalizedName(area, loc, 'area'))}
                    </PopularDestinations.Chip>
                  );
                })}
              </PopularDestinations.Group>
              <PopularDestinations.Group label={t('popular.schools')}>
                {POPULAR_SCHOOLS.map((school) => {
                  const slug = entitySlug(school, loc, 'university');
                  return (
                    <PopularDestinations.Chip
                      key={school}
                      href={routeHref('universities', slug)}
                      source="home"
                      type="university"
                      slug={slug}
                    >
                      {getLocalizedName(school, loc, 'university')}
                    </PopularDestinations.Chip>
                  );
                })}
              </PopularDestinations.Group>
            </PopularDestinations>
          }
        />

        <section className="mt-8 w-full border-t border-border/60">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-6">
              <NavigateCard href="/vari" className="md:col-span-4 md:min-h-[11rem]">
                <NavigateCard.Swatches hexes={atmosphereHexes} />
                <NavigateCard.Body>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {t('nav.allColors')}
                  </h2>
                  <p className="mt-1 max-w-[45ch] text-sm text-muted-foreground">
                    {t('nav.colorsDescription')}
                  </p>
                </NavigateCard.Body>
              </NavigateCard>
              <NavigateCard href="/ala" className="md:col-span-2">
                <NavigateCard.Body>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {t('nav.allFields')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('nav.fieldsDescription')}</p>
                </NavigateCard.Body>
              </NavigateCard>
              <NavigateCard href="/oppilaitos" className="md:col-span-2">
                <NavigateCard.Body>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {t('nav.allSchools')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('nav.schoolsDescription')}
                  </p>
                </NavigateCard.Body>
              </NavigateCard>
              <NavigateCard href="/alue" className="md:col-span-2">
                <NavigateCard.Body>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {t('nav.allAreas')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('nav.areasDescription')}</p>
                </NavigateCard.Body>
              </NavigateCard>
              <NavigateCard href="/blog" className="md:col-span-2">
                <NavigateCard.Body>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {t('common.blog')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('nav.navigateDescription')}
                  </p>
                </NavigateCard.Body>
              </NavigateCard>
            </div>
          </div>
        </section>

        <FaqList title={t('faq.title')}>
          <FaqItem question={t('faq.q1')} answer={t('faq.a1')} />
          <FaqItem question={t('faq.q2')} answer={t('faq.a2')} />
          <FaqItem question={t('faq.q3')} answer={t('faq.a3')} />
          <FaqItem question={t('faq.q4')} answer={t('faq.a4')} />
          <FaqItem question={t('faq.q5')} answer={t('faq.a5')} />
          <FaqItem question={t('faq.q6')} answer={t('faq.a6')} />
        </FaqList>
      </div>
    </>
  );
}
