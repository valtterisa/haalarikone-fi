import type { University } from '@/types/university';
import { loadUniversities } from './load-universities';
import type { QueryUnderstanding } from './query-understanding';
import { loadColorData } from './load-color-data';
import { filterUniversitiesWithFieldRelaxationWhenOrganizationSet } from './structured-search-filters';

let universitiesCache: Map<string, University[]> = new Map();

export async function filterUniversities(
  qu: QueryUnderstanding,
  locale: 'fi' | 'en' | 'sv' = 'fi',
): Promise<University[]> {
  if (qu.isGibberish) {
    return [];
  }

  const cacheKey = locale;
  let allUniversities: University[];

  if (universitiesCache.has(cacheKey)) {
    allUniversities = universitiesCache.get(cacheKey)!;
  } else {
    allUniversities = await loadUniversities(locale);
    universitiesCache.set(cacheKey, allUniversities);
  }

  const colorData = await loadColorData();

  return filterUniversitiesWithFieldRelaxationWhenOrganizationSet(allUniversities, qu, colorData);
}
