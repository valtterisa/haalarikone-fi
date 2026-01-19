import translationsData from '@/data/translations.json';

type Translations = {
  fields: Record<string, { fi: string; en: string; sv: string }>;
  colors: Record<string, { fi: string; en: string; sv: string }>;
  universities: Record<string, { fi: string; en: string; sv: string }>;
  areas: Record<string, { fi: string; en: string; sv: string }>;
};

const translations = translationsData as Translations;

/**
 * Gets the Finnish name from a localized name by reverse-looking up in translations
 */
export function getFinnishName(
  localizedName: string,
  locale: 'fi' | 'en' | 'sv',
  type: 'university' | 'color' | 'area' | 'field'
): string {
  // If already Finnish, return as-is
  if (locale === 'fi') {
    return localizedName;
  }

  const translationsMap =
    type === 'university' ? translations.universities :
    type === 'color' ? translations.colors :
    type === 'area' ? translations.areas :
    translations.fields;

  // Reverse lookup: find the Finnish name by matching the localized name
  for (const [finnishName, trans] of Object.entries(translationsMap)) {
    if (trans[locale] === localizedName) {
      return finnishName;
    }
  }

  // If not found in translations, assume it's already Finnish (fallback)
  return localizedName;
}

