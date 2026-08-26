import type { BlogPost } from '@/types/blog-post';
import { RAW_BLOG_POSTS } from '@/lib/blog-posts-data';

type LocaleString = string | { fi: string; en?: string; sv?: string };

type BlogSlugLocales = { fi: string; en: string; sv: string };

export function getLocaleString(value: LocaleString, locale: string): string {
  if (typeof value === 'string') {
    return value;
  }
  return value[locale as keyof typeof value] || value.en || value.fi;
}

export function blogSlugMatches(slugField: LocaleString, candidate: string): boolean {
  if (typeof slugField === 'string') {
    return slugField === candidate;
  }
  return Object.values(slugField).some((value) => value === candidate);
}

export function findRawBlogPost(slug: string): BlogPost | null {
  return RAW_BLOG_POSTS.find((post) => blogSlugMatches(post.slug, slug)) ?? null;
}

function slugLocalesFromPost(post: BlogPost): BlogSlugLocales {
  return {
    fi: getLocaleString(post.slug, 'fi'),
    en: getLocaleString(post.slug, 'en'),
    sv: getLocaleString(post.slug, 'sv'),
  };
}

export function resolveBlogSlug(slug: string, toLocale: string): string {
  const post = findRawBlogPost(slug);
  if (!post) {
    return slug;
  }
  return getLocaleString(post.slug, toLocale);
}

export function blogSlugAlternates(slug: string): BlogSlugLocales {
  const post = findRawBlogPost(slug);
  if (!post) {
    return { fi: slug, en: slug, sv: slug };
  }
  return slugLocalesFromPost(post);
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
    slug: getLocaleString(post.slug, locale),
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
