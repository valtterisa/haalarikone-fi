import type { University } from '@/types/university';
import translationsData from '@/data/translations.json';
import universitiesData from '@/data/overall_data.json';

type Translations = {
  fields: Record<string, { fi: string; en: string; sv: string }>;
  colors: Record<string, { fi: string; en: string; sv: string }>;
  universities: Record<string, { fi: string; en: string; sv: string }>;
  areas: Record<string, { fi: string; en: string; sv: string }>;
};

let translationsCache: Translations | null = null;

function getTranslationsSync(): Translations {
  if (!translationsCache) {
    translationsCache = translationsData as Translations;
  }
  return translationsCache;
}

async function loadTranslations(): Promise<Translations> {
  return getTranslationsSync();
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

    const direct = translationsMap[value];
    if (direct?.[locale]) return direct[locale];

    const normalizedValue = value.trim().toLowerCase();
    for (const entry of Object.values(translationsMap)) {
      if (
        entry.fi.trim().toLowerCase() === normalizedValue ||
        entry.en.trim().toLowerCase() === normalizedValue ||
        entry.sv.trim().toLowerCase() === normalizedValue
      ) {
        return entry[locale];
      }
    }

    return value;
  };

  const variLabel = variLabelRaw ? getLocalizedValue(variLabelRaw, 'color') : '';
  const slug = String(content.ainejarjestoSlug ?? '').trim();
  if (!slug) {
    throw new Error(`Missing ainejarjestoSlug for university id ${idNum}`);
  }

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
    ainejarjesto: content.ainejarjesto || null,
    slug,
    oppilaitos: oppilaitos ? getLocalizedValue(oppilaitos, 'university') : '',
  };
}

export function loadUniversitiesSync(locale: 'fi' | 'en' | 'sv' = 'fi'): University[] {
  const translations = getTranslationsSync();
  return (universitiesData as unknown[])
    .map((row) => normalizeJsonToUniversity(row, locale, translations))
    .filter((u): u is University => u !== null);
}

export async function loadUniversities(locale: 'fi' | 'en' | 'sv' = 'fi'): Promise<University[]> {
  const translations = await loadTranslations();
  return (universitiesData as unknown[])
    .map((row) => normalizeJsonToUniversity(row, locale, translations))
    .filter((u): u is University => u !== null);
}
