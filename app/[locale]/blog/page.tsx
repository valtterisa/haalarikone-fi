import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Page } from '@/components/page';
import Script from 'next/script';
import { loadBlogPosts } from '@/lib/load-blog-posts';
import { getTranslations } from 'next-intl/server';
import {
  absoluteHomeUrl,
  absoluteTranslatedRoute,
  alternateLanguageUrls,
  routeHref,
} from '@/lib/use-translated-routes';

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: 'fi' | 'en' | 'sv' }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    openGraph: {
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      type: 'website',
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: absoluteTranslatedRoute('blog', locale),
    },
    alternates: {
      canonical: absoluteTranslatedRoute('blog', locale),
      languages: alternateLanguageUrls('blog'),
    },
  };
}

export function generateStaticParams() {
  return ['fi', 'en', 'sv'].map((locale) => ({
    locale,
  }));
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: 'fi' | 'en' | 'sv' }>;
}) {
  const { locale } = await params;
  const posts = await loadBlogPosts(locale);
  const t = await getTranslations({ locale });

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('blog.pageTitle'),
    description: t('blog.pageDescription'),
    url: absoluteTranslatedRoute('blog', locale),
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
        name: t('blog.title'),
        item: absoluteTranslatedRoute('blog', locale),
      },
    ],
  };

  return (
    <>
      <Script
        id="collectionpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema),
        }}
      />
      <Script
        id="breadcrumb-schema-blog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Page>
        <div className="mb-12">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">{t('footer.home')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('blog.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mb-4 font-display text-4xl font-bold tracking-tight">{t('blog.title')}</h1>
          <p className="text-lg text-muted-foreground mb-8">{t('blog.description')}</p>
        </div>

        <div className="grid gap-8">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">{t('blog.noPosts')}</p>
          ) : (
            posts.map((post) => {
              return (
                <article
                  key={post.slug}
                  className="rounded-xl bg-muted/40 p-6 transition hover:bg-muted/70"
                >
                  <Link href={routeHref('blog', post.slug)}>
                    <h2 className="text-xl font-bold mb-2 hover:text-green transition">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-muted-foreground mb-4">{post.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <time dateTime={post.publishDate}>
                      {new Date(post.publishDate).toLocaleDateString(
                        locale === 'fi' ? 'fi-FI' : locale === 'en' ? 'en-US' : 'sv-SE',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </time>
                    {post.readingTime && (
                      <span>
                        {t('blog.readingTime')}: {post.readingTime} min
                      </span>
                    )}
                    <span>
                      {t('blog.author')}: {post.author}
                    </span>
                  </div>
                  <Link
                    href={routeHref('blog', post.slug)}
                    className="inline-block mt-4 text-green hover:underline font-medium"
                  >
                    {t('common.readMore')} →
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </Page>
    </>
  );
}
