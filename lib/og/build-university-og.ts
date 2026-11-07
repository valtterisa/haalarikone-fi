import { formatCountLabel, getOgLabels } from '@/lib/og/labels';
import { uniqueSwatches } from '@/lib/og/resolve-color-hex';
import type { UniversityOgPayload } from '@/lib/og/types';
import type { Locale } from '@/lib/slug-translations';
import { capitalizeFirstLetter } from '@/lib/utils';
import type { University } from '@/types/university';

export function buildUniversityOgPayload(
  universityName: string,
  rows: University[],
  locale: Locale,
): UniversityOgPayload {
  const labels = getOgLabels(locale);
  const swatches = uniqueSwatches(rows.map((row) => row.hex));
  const colorKeys = new Set(
    rows.flatMap((row) => (row.variBase.length > 0 ? row.variBase : [row.vari.toLowerCase()])),
  );

  return {
    kind: 'university',
    locale,
    title: capitalizeFirstLetter(universityName),
    overallCount: rows.length,
    overallCountLabel: formatCountLabel(rows.length, labels.overallSingular, labels.overallPlural),
    colorCount: colorKeys.size,
    colorCountLabel: formatCountLabel(colorKeys.size, labels.colorSingular, labels.colorPlural),
    swatches,
    brand: labels.brand,
    eyebrow: labels.universityEyebrow,
  };
}
