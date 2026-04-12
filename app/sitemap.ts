import { MetadataRoute } from 'next';
import { loadUniversities } from '@/lib/load-universities';
import { loadBlogPosts } from '@/lib/load-blog-posts';
import {
  getUniqueUniversities,
  getUniqueFields,
  getUniqueColors,
  getUniqueAreas,
} from '@/lib/get-unique-values';
import { getSlugForEntity } from '@/lib/slug-translations';
import { routing } from '@/i18n/routing';
import { localeSiteBaseUrl } from '@/lib/site-url';
import { absoluteTranslatedRoute } from '@/lib/use-translated-routes';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const universities = await loadUniversities('fi');
  const blogPosts = await loadBlogPosts();

  let dataLastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const siteBase = localeSiteBaseUrl(locale);

    entries.push({
      url: siteBase,
      lastModified: dataLastModified,
      changeFrequency: 'daily',
      priority: 1,
    });

    entries.push({
      url: absoluteTranslatedRoute('blog', locale),
      lastModified:
        blogPosts.length > 0
          ? new Date(Math.max(...blogPosts.map((p) => new Date(p.publishDate).getTime())))
          : dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    entries.push({
      url: absoluteTranslatedRoute('universities', locale),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const uniqueUniversities = getUniqueUniversities(universities);
    uniqueUniversities.forEach((uni) => {
      entries.push({
        url: absoluteTranslatedRoute(
          'universities',
          locale,
          getSlugForEntity(uni, locale, 'university'),
        ),
        lastModified: dataLastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });

    entries.push({
      url: absoluteTranslatedRoute('fields', locale),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const uniqueFields = getUniqueFields(universities);
    uniqueFields.forEach((field) => {
      entries.push({
        url: absoluteTranslatedRoute('fields', locale, getSlugForEntity(field, locale, 'field')),
        lastModified: dataLastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });

    entries.push({
      url: absoluteTranslatedRoute('colors', locale),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const uniqueColors = getUniqueColors(universities);
    uniqueColors.forEach((color) => {
      entries.push({
        url: absoluteTranslatedRoute('colors', locale, getSlugForEntity(color, locale, 'color')),
        lastModified: dataLastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });

    const uniqueAreas = getUniqueAreas(universities);
    uniqueAreas.forEach((area) => {
      entries.push({
        url: absoluteTranslatedRoute('areas', locale, getSlugForEntity(area, locale, 'area')),
        lastModified: dataLastModified,
        changeFrequency: 'yearly',
        priority: 0.5,
      });
    });

    universities.forEach((uni) => {
      entries.push({
        url: absoluteTranslatedRoute('overall', locale, uni.slug),
        lastModified: dataLastModified,
        changeFrequency: 'yearly',
        priority: 0.4,
      });
    });

    blogPosts.forEach((post) => {
      entries.push({
        url: absoluteTranslatedRoute('blog', locale, post.slug),
        lastModified: new Date(post.publishDate),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  }

  return entries;
}
