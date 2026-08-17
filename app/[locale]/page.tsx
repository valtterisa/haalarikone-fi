import SearchContainer from '@/components/search-container';
import { loadUniversities } from '@/lib/load-universities';
import { loadColorData } from '@/lib/load-color-data';
import FAQSchema from '@/components/faq-schema';
import FaqList from '@/components/faq-list';
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
import { Palette, Layers, GraduationCap, BookOpen, MapPin } from 'lucide-react';

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
      <div className="bg-white w-full min-h-screen flex flex-col items-center">
        <div className="flex flex-col items-center justify-center pt-8 pb-4">
          <div className="relative">
            <h1
              className="w-fit text-4xl md:text-7xl font-bold text-center"
              style={{
                background: 'linear-gradient(120deg, #65a30d 0%, #65a30d 100%) no-repeat',
                backgroundPosition: '0 95%',
                backgroundSize: '100% 0.25em',
                fontWeight: 'inherit',
                color: 'inherit',
              }}
            >
              {t('home.title')}
            </h1>
          </div>

          <p className="text-center max-w-2xl mx-auto px-4 mt-6 mb-4">{t('home.description')}</p>
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
              <PopularDestinations.Group icon={MapPin} label={t('popular.areas')}>
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
              <PopularDestinations.Group icon={GraduationCap} label={t('popular.schools')}>
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

        <section className="w-full border-t border-border/60 mt-12">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                {t('nav.navigate')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NavigateCard href="/vari">
                  <NavigateCard.Icon>
                    <Palette className="h-6 w-6" />
                  </NavigateCard.Icon>
                  <NavigateCard.Body>
                    <h3 className="text-lg font-semibold text-foreground">{t('nav.allColors')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('nav.colorsDescription')}
                    </p>
                  </NavigateCard.Body>
                </NavigateCard>
                <NavigateCard href="/ala">
                  <NavigateCard.Icon>
                    <Layers className="h-6 w-6" />
                  </NavigateCard.Icon>
                  <NavigateCard.Body>
                    <h3 className="text-lg font-semibold text-foreground">{t('nav.allFields')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('nav.fieldsDescription')}
                    </p>
                  </NavigateCard.Body>
                </NavigateCard>
                <NavigateCard href="/oppilaitos">
                  <NavigateCard.Icon>
                    <GraduationCap className="h-6 w-6" />
                  </NavigateCard.Icon>
                  <NavigateCard.Body>
                    <h3 className="text-lg font-semibold text-foreground">{t('nav.allSchools')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('nav.schoolsDescription')}
                    </p>
                  </NavigateCard.Body>
                </NavigateCard>
                <NavigateCard href="/alue">
                  <NavigateCard.Icon>
                    <MapPin className="h-6 w-6" />
                  </NavigateCard.Icon>
                  <NavigateCard.Body>
                    <h3 className="text-lg font-semibold text-foreground">{t('nav.allAreas')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('nav.areasDescription')}
                    </p>
                  </NavigateCard.Body>
                </NavigateCard>
                <NavigateCard href="/blog">
                  <NavigateCard.Icon>
                    <BookOpen className="h-6 w-6" />
                  </NavigateCard.Icon>
                  <NavigateCard.Body>
                    <h3 className="text-lg font-semibold text-foreground">{t('common.blog')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('nav.navigateDescription')}
                    </p>
                  </NavigateCard.Body>
                </NavigateCard>
              </div>
            </div>
          </div>
        </section>

        <FaqList title={t('faq.title')}>
          <FaqList.Item question={t('faq.q1')} answer={t('faq.a1')} />
          <FaqList.Item question={t('faq.q2')} answer={t('faq.a2')} />
          <FaqList.Item question={t('faq.q3')} answer={t('faq.a3')} />
          <FaqList.Item question={t('faq.q4')} answer={t('faq.a4')} />
          <FaqList.Item question={t('faq.q5')} answer={t('faq.a5')} />
          <FaqList.Item question={t('faq.q6')} answer={t('faq.a6')} />
        </FaqList>
      </div>
    </>
  );
}
