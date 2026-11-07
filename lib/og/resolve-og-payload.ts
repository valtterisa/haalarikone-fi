import { buildOrganizationOgPayload, findOrganizationBySlug } from '@/lib/og/build-organization-og';
import { buildUniversityOgPayload } from '@/lib/og/build-university-og';
import type { OgPayload } from '@/lib/og/types';
import { loadUniversities } from '@/lib/load-universities';
import type { Locale } from '@/lib/slug-translations';
import { resolveTaxonomyHub } from '@/lib/taxonomy-hub';

export async function resolveOrganizationOgPayload(
  slug: string,
  locale: Locale,
): Promise<OgPayload | null> {
  const universities = await loadUniversities(locale);
  const overall = findOrganizationBySlug(universities, slug);
  if (!overall) return null;
  return buildOrganizationOgPayload(overall, locale);
}

export async function resolveUniversityOgPayload(
  slug: string,
  locale: Locale,
): Promise<OgPayload | null> {
  const universities = await loadUniversities(locale);
  const hub = resolveTaxonomyHub(universities, slug, locale, 'university');
  if (!hub) return null;
  return buildUniversityOgPayload(hub.localized, hub.rows, locale);
}
