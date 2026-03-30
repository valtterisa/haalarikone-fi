import type { University } from '@/types/university';
import translationsData from '@/data/translations.json';
import universitiesData from '@/data/overall_colors_upstash.json';

type Translations = {
  fields: Record<string, { fi: string; en: string; sv: string }>;
  colors: Record<string, { fi: string; en: string; sv: string }>;
  universities: Record<string, { fi: string; en: string; sv: string }>;
  areas: Record<string, { fi: string; en: string; sv: string }>;
};

let translationsCache: Translations | null = null;

async function loadTranslations(): Promise<Translations> {
  if (translationsCache) {
    return translationsCache;
  }

  translationsCache = translationsData as Translations;
  return translationsCache;
}

function normalizeJsonToUniversity(
  row: any,
  locale: 'fi' | 'en' | 'sv',
  translations: Translations,
): University | null {
  if (!row) return null;
  const idNum = Number(row.id);
  if (Number.isNaN(idNum)) return null;

  const content = row.content || {};
  const metadata = row.metadata || {};

  const rawVari = content.vari as { label?: string; base?: string[] } | null | undefined;
  const variLabelRaw = rawVari?.label ?? '';
  const normalizedVariBase = Array.from(
    new Set((rawVari?.base ?? []).map((b) => String(b).toLowerCase().trim()).filter(Boolean)),
  );
  const alue = content.alue ?? '';
  const ala = content.ala || null;
  const oppilaitos = content.oppilaitos ?? '';

  const getLocalizedValue = (
    value: string,
    type: 'color' | 'area' | 'university' | 'field',
  ): string => {
    const translationsMap =
      type === 'color'
        ? translations.colors
        : type === 'area'
          ? translations.areas
          : type === 'university'
            ? translations.universities
            : translations.fields;

    const translation = translationsMap[value];
    return translation?.[locale] || value;
  };

  const variLabel = variLabelRaw ? getLocalizedValue(variLabelRaw, 'color') : '';

  return {
    id: idNum,
    vari: variLabel,
    variLabel,
    variBase: normalizedVariBase,
    hex: metadata.hex ?? '',
    alue: alue ? getLocalizedValue(alue, 'area') : '',
    ala: ala
      ? ala
          .split(', ')
          .map((f: string) => {
            const field = f.trim();
            return getLocalizedValue(field, 'field');
          })
          .join(', ')
      : null,
    ainejärjestö: content.ainejärjestö || null,
    oppilaitos: oppilaitos ? getLocalizedValue(oppilaitos, 'university') : '',
  };
}

export async function loadUniversities(locale: 'fi' | 'en' | 'sv' = 'fi'): Promise<University[]> {
  try {
    const translations = await loadTranslations();
    const universities = (universitiesData as any[])
      .map((row) => normalizeJsonToUniversity(row, locale, translations))
      .filter(Boolean) as University[];
    return universities;
  } catch (error) {
    console.error('Failed to load universities:', error);
    return [];
  }
}
