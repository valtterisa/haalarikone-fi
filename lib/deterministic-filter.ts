import type { University } from '@/types/university';
import { loadUniversities } from './load-universities';
import type { QueryUnderstanding } from './query-understanding';
import { loadColorData } from './load-color-data';

let universitiesCache: Map<string, University[]> = new Map();

export async function filterUniversities(
    qu: QueryUnderstanding,
    locale: 'fi' | 'en' | 'sv' = 'fi'
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

    return allUniversities.filter((uni) => {
        if (qu.filters.color) {
            const colorLower = qu.filters.color.toLowerCase();
            let colorMatched = false;

            for (const colorInfo of Object.values(colorData.colors)) {
                const allVariants = [...colorInfo.main, ...colorInfo.shades];
                if (allVariants.some(c => c.toLowerCase() === colorLower)) {
                    if (allVariants.some(c => uni.vari.toLowerCase().includes(c.toLowerCase()))) {
                        colorMatched = true;
                        break;
                    }
                }
            }

            if (!colorMatched) return false;
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

        return true;
    });
}
