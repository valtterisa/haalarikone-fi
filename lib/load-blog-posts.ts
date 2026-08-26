import type { BlogPost } from '@/types/blog-post';
import { RAW_BLOG_POSTS } from '@/lib/blog-posts-data';

type LocaleString = string | { fi: string; en?: string; sv?: string };
type BlogSlugLocales = BlogPost['slug'];
type BlogLocale = keyof BlogSlugLocales;

export function getLocaleString(value: LocaleString, locale: string): string {
  if (typeof value === 'string') {
    return value;
  }
  return value[locale as keyof typeof value] || value.en || value.fi;
}

function isBlogLocale(locale: string): locale is BlogLocale {
  return locale === 'fi' || locale === 'en' || locale === 'sv';
}

function slugForLocale(slugs: BlogSlugLocales, locale: string): string {
  return isBlogLocale(locale) ? slugs[locale] : slugs.fi;
}

export function findRawBlogPost(slug: string): BlogPost | null {
  return (
    RAW_BLOG_POSTS.find((post) => Object.values(post.slug).includes(slug)) ?? null
  );
}

export function resolveBlogSlug(slug: string, toLocale: string): string {
  const post = findRawBlogPost(slug);
  if (!post) {
    return slug;
  }
  return slugForLocale(post.slug, toLocale);
}

export function blogSlugAlternates(slug: string): BlogSlugLocales {
  const post = findRawBlogPost(slug);
  if (!post) {
    return { fi: slug, en: slug, sv: slug };
  }
  return post.slug;
}

export type ResolvedBlogPost = {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  publishDate: string;
  readingTime?: number;
};

function selectLocaleForPost(post: BlogPost, locale: string): ResolvedBlogPost {
  return {
    slug: slugForLocale(post.slug, locale),
    title: getLocaleString(post.title, locale),
    description: getLocaleString(post.description, locale),
    content: getLocaleString(post.content, locale),
    author: getLocaleString(post.author, locale),
    publishDate: post.publishDate,
    readingTime: post.readingTime,
  };
}

export async function loadBlogPosts(locale: string = 'fi'): Promise<ResolvedBlogPost[]> {
  return RAW_BLOG_POSTS.map((post) => selectLocaleForPost(post, locale)).sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

export async function loadBlogPost(
  slug: string,
  locale: string = 'fi',
): Promise<ResolvedBlogPost | null> {
  const post = findRawBlogPost(slug);
  if (!post) {
    return null;
  }
  return selectLocaleForPost(post, locale);
}
