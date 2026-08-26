import { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import { Page } from '@/components/page';
import { loadBlogPosts, loadBlogPost, blogSlugAlternates } from '@/lib/load-blog-posts';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { localeSiteBaseUrl, SITE_ORIGIN } from '@/lib/site-url';
import {
  absoluteTranslatedRoute,
  getTranslatedRoute,
} from '@/lib/use-translated-routes';

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
      url: absoluteTranslatedRoute('blog', locale, post.slug),
    },
    twitter: {
      card: 'summary_large_image',
      title: titleString,
      description: descriptionString,
      images: ['/haalarikone-og.png'],
    },
    alternates: {
      canonical: absoluteTranslatedRoute('blog', locale, post.slug),
      languages: {
        fi: absoluteTranslatedRoute('blog', 'fi', slugAlts.fi),
        en: absoluteTranslatedRoute('blog', 'en', slugAlts.en),
        sv: absoluteTranslatedRoute('blog', 'sv', slugAlts.sv),
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
  const baseUrl = localeSiteBaseUrl(locale);

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
    url: `${baseUrl}${getTranslatedRoute('blog', locale, post.slug)}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${getTranslatedRoute('blog', locale, post.slug)}`,
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
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('blog.title'),
        item: `${baseUrl}${getTranslatedRoute('blog', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: titleString,
        item: `${baseUrl}${getTranslatedRoute('blog', locale, post.slug)}`,
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
            className="prose prose-green max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-green prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground"
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
