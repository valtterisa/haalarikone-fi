import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Script from "next/script";
import { loadBlogPosts } from "@/lib/load-blog-posts";
import { getTranslations } from 'next-intl/server';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    openGraph: {
      title: t('pageTitle'),
      description: t('pageDescription'),
      images: [
        {
          url: "/haalarikone-og.png",
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      type: "website",
      siteName: "Haalarikone",
      locale: locale === 'fi' ? 'fi_FI' : locale === 'en' ? 'en_US' : 'sv_SE',
      url: `${baseUrl}/blog`,
    },
    alternates: {
      canonical: `${baseUrl}/blog`,
      languages: {
        fi: "https://haalarikone.fi/blog",
        en: "https://haalarikone.fi/en/blog",
        sv: "https://haalarikone.fi/sv/blog",
      },
    },
  };
}

export async function generateStaticParams() {
  return ['fi', 'en', 'sv'].map((locale) => ({
    locale,
  }));
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = await loadBlogPosts(locale);
  const t = await getTranslations({ locale });
  const baseUrl = locale === 'fi' ? 'https://haalarikone.fi' : `https://haalarikone.fi/${locale}`;

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t('blog.pageTitle'),
    description: t('blog.pageDescription'),
    url: `${baseUrl}/blog`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t('footer.home'),
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t('blog.title'),
        item: `${baseUrl}/blog`,
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <Breadcrumb className="mb-4">
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
          <h1 className="text-4xl font-bold mb-4">{t('blog.title')}</h1>
          <p className="text-lg text-gray-700">
            {t('blog.description')}
          </p>
        </div>

        <div className="grid gap-8">
          {posts.length === 0 ? (
            <p className="text-gray-600">{t('blog.noPosts')}</p>
          ) : (
            posts.map((post) => {
              const titleString = typeof post.title === 'string' ? post.title : (post.title[locale as keyof typeof post.title] || post.title.en || post.title.fi || '');
              const descriptionString = typeof post.description === 'string' ? post.description : (post.description[locale as keyof typeof post.description] || post.description.en || post.description.fi || '');
              const authorString = typeof post.author === 'string' ? post.author : (post.author[locale as keyof typeof post.author] || post.author.en || post.author.fi || '');
              
              return (
              <article
                key={post.slug}
                className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold mb-2 hover:text-green transition">
                    {titleString}
                  </h2>
                </Link>
                <p className="text-gray-700 mb-4">{descriptionString}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <time dateTime={post.publishDate}>
                    {new Date(post.publishDate).toLocaleDateString(locale === 'fi' ? "fi-FI" : locale === 'en' ? "en-US" : "sv-SE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.readingTime && (
                    <span>{t('blog.readingTime')}: {post.readingTime} min</span>
                  )}
                  <span>{t('blog.author')}: {authorString}</span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-block mt-4 text-green hover:underline font-medium"
                >
                  {t('common.readMore')} →
                </Link>
              </article>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

