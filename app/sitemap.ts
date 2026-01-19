import { MetadataRoute } from "next";
import { loadUniversities } from "@/lib/load-universities";
import { loadBlogPosts } from "@/lib/load-blog-posts";
import {
  getUniqueUniversities,
  getUniqueFields,
  getUniqueColors,
  getUniqueAreas,
} from "@/lib/get-unique-values";
import { getSlugForEntity } from "@/lib/slug-translations";
import { promises as fs } from "fs";
import path from "path";
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://haalarikone.fi";
  const universities = await loadUniversities('fi');
  const blogPosts = await loadBlogPosts();

  const jsonFilePath = path.join(
    process.cwd(),
    "data",
    "overall_colors_upstash.json"
  );

  let dataLastModified = new Date();
  try {
    const stats = await fs.stat(jsonFilePath);
    if (stats) {
      dataLastModified = stats.mtime;
    }
  } catch { }

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const localePrefix = locale === 'fi' ? '' : `/${locale}`;

    entries.push({
      url: `${baseUrl}${localePrefix}`,
      lastModified: dataLastModified,
      changeFrequency: "daily",
      priority: 1,
    });

    entries.push({
      url: `${baseUrl}${localePrefix}/blog`,
      lastModified:
        blogPosts.length > 0
          ? new Date(
            Math.max(
              ...blogPosts.map((p) => new Date(p.publishDate).getTime())
            )
          )
          : dataLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });

    entries.push({
      url: `${baseUrl}${localePrefix}/oppilaitos`,
      lastModified: dataLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });

    const uniqueUniversities = getUniqueUniversities(universities);
    uniqueUniversities.forEach((uni) => {
      entries.push({
        url: `${baseUrl}${localePrefix}/oppilaitos/${getSlugForEntity(uni, locale as 'fi' | 'en' | 'sv', 'university')}`,
        lastModified: dataLastModified,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    entries.push({
      url: `${baseUrl}${localePrefix}/ala`,
      lastModified: dataLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });

    const uniqueFields = getUniqueFields(universities);
    uniqueFields.forEach((field) => {
      entries.push({
        url: `${baseUrl}${localePrefix}/ala/${getSlugForEntity(field, locale as 'fi' | 'en' | 'sv', 'field')}`,
        lastModified: dataLastModified,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    entries.push({
      url: `${baseUrl}${localePrefix}/vari`,
      lastModified: dataLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });

    const uniqueColors = getUniqueColors(universities);
    uniqueColors.forEach((color) => {
      entries.push({
        url: `${baseUrl}${localePrefix}/vari/${getSlugForEntity(color, locale as 'fi' | 'en' | 'sv', 'color')}`,
        lastModified: dataLastModified,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    const uniqueAreas = getUniqueAreas(universities);
    uniqueAreas.forEach((area) => {
      entries.push({
        url: `${baseUrl}${localePrefix}/alue/${getSlugForEntity(area, locale as 'fi' | 'en' | 'sv', 'area')}`,
        lastModified: dataLastModified,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    });

    universities.forEach((uni) => {
      entries.push({
        url: `${baseUrl}${localePrefix}/haalari/${uni.id}`,
        lastModified: dataLastModified,
        changeFrequency: "yearly",
        priority: 0.4,
      });
    });

    blogPosts.forEach((post) => {
      entries.push({
        url: `${baseUrl}${localePrefix}/blog/${post.slug}`,
        lastModified: new Date(post.publishDate),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });
  }

  return entries;
}
