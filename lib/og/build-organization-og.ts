import { getOgLabels } from '@/lib/og/labels';
import { resolveColorHex, textOnColor } from '@/lib/og/resolve-color-hex';
import type { OrganizationOgPayload } from '@/lib/og/types';
import { splitCsv } from '@/lib/popular-destinations';
import type { Locale } from '@/lib/slug-translations';
import { capitalizeFirstLetter } from '@/lib/utils';
import type { University } from '@/types/university';

export function buildOrganizationOgPayload(
  overall: University,
  locale: Locale,
): OrganizationOgPayload {
  const labels = getOgLabels(locale);
  const colorHex = resolveColorHex(overall.hex);
  const area = splitCsv(overall.alue)[0] || null;
  const field = splitCsv(overall.ala)[0] || null;

  return {
    kind: 'organization',
    locale,
    title: overall.ainejarjesto?.trim() || labels.unknownOrganization,
    university: overall.oppilaitos,
    area,
    field,
    colorLabel: capitalizeFirstLetter(overall.vari),
    colorHex,
    textOnColor: textOnColor(colorHex),
    brand: labels.brand,
    eyebrow: labels.organizationEyebrow,
    colorCaption: labels.colorCaption,
  };
}

export function findOrganizationBySlug(
  universities: University[],
  slug: string,
): University | undefined {
  return universities.find((row) => row.slug === slug);
}
