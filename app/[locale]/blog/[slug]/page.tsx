import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import { Page } from '@/components/page';
import { loadBlogPosts, loadBlogPost, blogSlugAlternates } from '@/lib/load-blog-posts';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SITE_ORIGIN } from '@/lib/site-url';
import { routeHref, absoluteUrl } from '@/lib/use-translated-routes';

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: 'fi' | 'en' | 'sv'; slug: string }>;
};

export async function generateStaticParams() {
  const params = [];
  for (const locale of ['fi', 'en', 'sv'] as const) {
    const posts = await loadBlogPosts(locale);
    for (const post of posts) {
      params.push({
        locale,
        slug: post.slug,
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await loadBlogPost(slug, locale);

  if (!post) {
    return {
      title: 'Artikkelia ei löytynyt | Haalarikone',
    };
  }

  const titleString = post.title;
  const descriptionString = post.description;
  const authorString = post.author;
  const category = 'Opiskelijakulttuuri';
  const slugAlts = blogSlugAlternates(slug);

  return {
    title: `${titleString} | Haalarikone`,
    description: descriptionString,
    keywords: [
      'haalarivärit',
      'opiskelijahaalarit',
      'suomen opiskelijakulttuuri',
      'haalaritietokanta',
      'opiskelijakulttuuri',
      category.toLowerCase(),
      ...titleString.toLowerCase().split(' ').slice(0, 5),
    ],
    openGraph: {
      title: titleString,
      description: descriptionString,
      images: [
        {
          url: '/haalarikone-og.png',
          width: 1200,
          height: 630,
          alt: titleString,
        },
      ],
      type: 'article',
      publishedTime: post.publishDate,
      modifiedTime: post.publishDate,
      authors: [authorString],
      siteName: 'Haalarikone',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: absoluteUrl(locale, routeHref('blog', post.slug)),
    },
    twitter: {
      card: 'summary_large_image',
      title: titleString,
      description: descriptionString,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteUrl(locale, routeHref('blog', post.slug)),
      languages: {
        fi: absoluteUrl('fi', routeHref('blog', slugAlts.fi)),
        en: absoluteUrl('en', routeHref('blog', slugAlts.en)),
        sv: absoluteUrl('sv', routeHref('blog', slugAlts.sv)),
      },
    },
    other: {
      'article:author': authorString,
      'article:section': category,
      'article:published_time': post.publishDate,
      'article:modified_time': post.publishDate,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = await loadBlogPost(slug, locale);
  const t = await getTranslations({ locale });

  if (!post) {
    notFound();
  }

  const contentString = post.content;
  const titleString = post.title;
  const descriptionString = post.description;
  const authorString = post.author;
  const wordCount = contentString.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const timeRequired = post.readingTime ? `PT${post.readingTime}M` : undefined;
  const postUrl = absoluteUrl(locale, routeHref('blog', post.slug));

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: titleString,
    description: descriptionString,
    image: {
      '@type': 'ImageObject',
      url: `${SITE_ORIGIN}/haalarikone-og.png`,
      width: 1200,
      height: 630,
    },
    author: {
      '@type': 'Person',
      name: authorString,
      url: SITE_ORIGIN,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Haalarikone',
      url: SITE_ORIGIN,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/haalarikone-og.png`,
        width: 1200,
        height: 630,
      },
    },
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    url: postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    articleSection: 'Opiskelijakulttuuri',
    wordCount: wordCount,
    ...(timeRequired && { timeRequired }),
  };

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
        name: t('blog.title'),
        item: absoluteUrl(locale, routeHref('blog')),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: titleString,
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <Script
        id={`blogposting-schema-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingSchema),
        }}
      />
      <Script
        id={`breadcrumb-schema-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Page>
        <Link href="/blog" className="text-green hover:underline mb-4 inline-block">
          ← {t('common.backToHome')}
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{titleString}</h1>
            <p className="text-lg text-muted-foreground mb-6">{descriptionString}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4">
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
                {t('blog.author')}: {authorString}
              </span>
            </div>
          </header>

          <div
            className="prose prose-green max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-green prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:text-foreground"
            dangerouslySetInnerHTML={{ __html: contentString }}
          />
        </article>

        <div className="mt-12 pt-8 border-t">
          <Link href="/blog" className="text-green hover:underline font-medium">
            ← {t('common.backToHome')}
          </Link>
        </div>
      </Page>
    </>
  );
}
