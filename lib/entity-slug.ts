import { getFinnishName } from '@/lib/get-finnish-name';
import { getSlugForEntity, type Locale } from '@/lib/slug-translations';

export function entitySlug(
  localizedName: string,
  locale: Locale,
  type: 'field' | 'color' | 'university' | 'area',
): string {
  const finnish = getFinnishName(localizedName, locale, type);
  return getSlugForEntity(finnish, locale, type);
}
