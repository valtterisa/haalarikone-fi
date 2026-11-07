import { getOgLabels } from '@/lib/og/labels';
import type { Locale } from '@/lib/slug-translations';
import type { University } from '@/types/university';

export type OrganizationSeoMeta = {
  documentTitle: string;
  openGraphTitle: string;
  fallbackDescription: string;
  primaryName: string;
};

/**
 * Org-first titles/descriptions for student organization pages.
 * Color stays in the description, not as the leading title token.
 */
export function buildOrganizationSeoMeta(overall: University, locale: Locale): OrganizationSeoMeta {
  const labels = getOgLabels(locale);
  const orgName = overall.ainejarjesto?.trim() || null;
  const primaryName = orgName ?? labels.unknownOrganization;
  const color = overall.vari;
  const university = overall.oppilaitos;
  const field = overall.ala?.trim() || null;

  const openGraphTitle = orgName ? `${orgName} - ${university}` : `${university} - ${color}`;

  const documentTitle = `${openGraphTitle} | Haalarikone`;

  const fallbackDescription = orgName
    ? [`${orgName}: ${color} haalari, ${university}`, field ? `– ${field}` : null]
        .filter(Boolean)
        .join(' ')
    : [`${color} haalari, ${university}`, field ? `– ${field}` : null].filter(Boolean).join(' ');

  return {
    documentTitle,
    openGraphTitle,
    fallbackDescription,
    primaryName,
  };
}
