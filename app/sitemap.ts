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
import { routeHref, absoluteUrl } from '@/lib/use-translated-routes';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const universities = await loadUniversities('fi');

  let dataLastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const blogPosts = await loadBlogPosts(locale);

    entries.push({
      url: absoluteUrl(locale, '/'),
      lastModified: dataLastModified,
      changeFrequency: 'daily',
      priority: 1,
    });

    entries.push({
      url: absoluteUrl(locale, '/tietosuoja'),
      lastModified: dataLastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    });

    entries.push({
      url: absoluteUrl(locale, '/kayttoehdot'),
      lastModified: dataLastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    });

    entries.push({
      url: absoluteUrl(locale, routeHref('blog')),
      lastModified:
        blogPosts.length > 0
          ? new Date(Math.max(...blogPosts.map((p) => new Date(p.publishDate).getTime())))
          : dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    entries.push({
      url: absoluteUrl(locale, routeHref('universities')),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const uniqueUniversities = getUniqueUniversities(universities);
    uniqueUniversities.forEach((uni) => {
      entries.push({
        url: absoluteUrl(locale, routeHref('universities', getSlugForEntity(uni, locale, 'university'))),
        lastModified: dataLastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });

    entries.push({
      url: absoluteUrl(locale, routeHref('fields')),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const uniqueFields = getUniqueFields(universities);
    uniqueFields.forEach((field) => {
      entries.push({
        url: absoluteUrl(locale, routeHref('fields', getSlugForEntity(field, locale, 'field'))),
        lastModified: dataLastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });

    entries.push({
      url: absoluteUrl(locale, routeHref('colors')),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const uniqueColors = getUniqueColors(universities);
    uniqueColors.forEach((color) => {
      entries.push({
        url: absoluteUrl(locale, routeHref('colors', getSlugForEntity(color, locale, 'color'))),
        lastModified: dataLastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });

    entries.push({
      url: absoluteUrl(locale, routeHref('areas')),
      lastModified: dataLastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    const uniqueAreas = getUniqueAreas(universities);
    uniqueAreas.forEach((area) => {
      entries.push({
        url: absoluteUrl(locale, routeHref('areas', getSlugForEntity(area, locale, 'area'))),
        lastModified: dataLastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    universities.forEach((uni) => {
      entries.push({
        url: absoluteUrl(locale, routeHref('overall', uni.slug)),
        lastModified: dataLastModified,
        changeFrequency: 'yearly',
        priority: 0.4,
      });
    });

    blogPosts.forEach((post) => {
      entries.push({
        url: absoluteUrl(locale, routeHref('blog', post.slug)),
        lastModified: new Date(post.publishDate),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  }

  return entries;
}
