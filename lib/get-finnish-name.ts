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
export function translationsMap(type: 'university' | 'color' | 'area' | 'field') {
  return type === 'university'
    ? translations.universities
    : type === 'color'
      ? translations.colors
      : type === 'area'
        ? translations.areas
        : translations.fields;
}

export function getLocalizedName(
  name: string,
  locale: 'fi' | 'en' | 'sv',
  type: 'university' | 'color' | 'area' | 'field',
): string {
  const map = translationsMap(type);
  const direct = map[name];
  if (direct?.[locale]) {
    return direct[locale];
  }

  const normalized = name.trim().toLowerCase();
  for (const entry of Object.values(map)) {
    if (
      entry.fi.trim().toLowerCase() === normalized ||
      entry.en.trim().toLowerCase() === normalized ||
      entry.sv.trim().toLowerCase() === normalized
    ) {
      return entry[locale];
    }
  }

  return name;
}

export function getFinnishName(
  localizedName: string,
  locale: 'fi' | 'en' | 'sv',
  type: 'university' | 'color' | 'area' | 'field',
): string {
  // If already Finnish, return as-is
  if (locale === 'fi') {
    return localizedName;
  }

  const map = translationsMap(type);

  for (const [finnishName, trans] of Object.entries(map)) {
    if (trans[locale] === localizedName) {
      return finnishName;
    }
  }

  // If not found in translations, assume it's already Finnish (fallback)
  return localizedName;
}
