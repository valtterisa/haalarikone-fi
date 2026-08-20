import type { University } from '@/types/university';
import type { ColorData } from '@/lib/load-color-data';

export type UniversityFilterCriteria = {
  color?: string;
  area?: string;
  field?: string;
  school?: string;
  organization?: string;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function matchesColor(
  uni: University,
  colorKey: string,
  colorData: ColorData,
): boolean {
  const colorInfo = colorData.colors[colorKey];
  if (!colorInfo) {
    return normalize(uni.vari).includes(normalize(colorKey));
  }

  const baseOk =
    !uni.variBase?.length || uni.variBase.some((base) => normalize(base) === normalize(colorKey));
  if (!baseOk) return false;

  const aliases = [...colorInfo.main, ...colorInfo.shades];
  return aliases.some((alias) => normalize(uni.vari).includes(normalize(alias)));
}

export function matchesUniversityFilters(
  uni: University,
  filters: UniversityFilterCriteria,
  colorData: ColorData,
): boolean {
  if (filters.color && !matchesColor(uni, filters.color, colorData)) {
    return false;
  }

  if (filters.area && !normalize(uni.alue).includes(normalize(filters.area))) {
    return false;
  }

  if (filters.field && !normalize(uni.ala || '').includes(normalize(filters.field))) {
    return false;
  }

  if (filters.school && !normalize(uni.oppilaitos).includes(normalize(filters.school))) {
    return false;
  }

  if (filters.organization) {
    const org = normalize(uni.ainejarjesto || '');
    const slug = normalize(uni.slug);
    const wanted = normalize(filters.organization);
    if (!org.includes(wanted) && !slug.includes(wanted)) {
      return false;
    }
  }

  return true;
}

export function filterUniversities(
  universities: University[],
  filters: UniversityFilterCriteria,
  colorData: ColorData,
): University[] {
  const hasFilter = Boolean(
    filters.color || filters.area || filters.field || filters.school || filters.organization,
  );
  if (!hasFilter) return universities;
  return universities.filter((uni) => matchesUniversityFilters(uni, filters, colorData));
}
