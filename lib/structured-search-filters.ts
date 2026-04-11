import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';
import type { ColorData } from './load-color-data';

export function universityMatchesStructuredSearchFilters(
  uni: University,
  qu: QueryUnderstanding,
  colorData: ColorData,
): boolean {
  if (qu.filters.color) {
    const colorLower = qu.filters.color.toLowerCase();
    let matchedBaseColor: string | null = null;

    for (const [baseKey, colorInfo] of Object.entries(colorData.colors)) {
      const allVariants = [...colorInfo.main, ...colorInfo.shades];
      if (allVariants.some((c) => c.toLowerCase() === colorLower)) {
        matchedBaseColor = baseKey;
        break;
      }
    }

    if (matchedBaseColor) {
      if (!uni.variBase?.includes(matchedBaseColor)) return false;
    } else {
      if (!uni.vari.toLowerCase().includes(colorLower)) return false;
    }
  }

  if (qu.filters.area) {
    const areaLower = qu.filters.area.toLowerCase();
    if (!uni.alue.toLowerCase().includes(areaLower)) {
      return false;
    }
  }

  if (qu.filters.field) {
    const fieldLower = qu.filters.field.toLowerCase();
    if (!uni.ala?.toLowerCase().includes(fieldLower)) {
      return false;
    }
  }

  if (qu.filters.school) {
    const schoolLower = qu.filters.school.toLowerCase();
    if (!uni.oppilaitos.toLowerCase().includes(schoolLower)) {
      return false;
    }
  }

  if (qu.filters.organization) {
    const orgLower = qu.filters.organization.toLowerCase();
    if (!uni.ainejarjesto?.toLowerCase().includes(orgLower)) {
      return false;
    }
  }

  return true;
}

export function filterUniversitiesWithFieldRelaxationWhenOrganizationSet(
  universities: University[],
  qu: QueryUnderstanding,
  colorData: ColorData,
): University[] {
  const run = (q: QueryUnderstanding) =>
    universities.filter((uni) => universityMatchesStructuredSearchFilters(uni, q, colorData));

  let results = run(qu);
  if (results.length === 0 && qu.filters.organization && qu.filters.field) {
    results = run({
      ...qu,
      filters: { ...qu.filters, field: undefined },
    });
  }
  return results;
}
