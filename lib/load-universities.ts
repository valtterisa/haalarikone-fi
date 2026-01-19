import { promises as fs } from "fs";
import path from "path";
import type { University } from "@/types/university";

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

  const filePath = path.join(process.cwd(), 'data', 'translations.json');
  const fileContents = await fs.readFile(filePath, 'utf-8');
  translationsCache = JSON.parse(fileContents) as Translations;
  return translationsCache;
}

function normalizeJsonToUniversity(row: any, locale: 'fi' | 'en' | 'sv', translations: Translations): University | null {
  if (!row) return null;
  const idNum = Number(row.id);
  if (Number.isNaN(idNum)) return null;

  const content = row.content || {};
  const metadata = row.metadata || {};

  const vari = content.vari ?? "";
  const alue = content.alue ?? "";
  const ala = content.ala || null;
  const oppilaitos = content.oppilaitos ?? "";

  const getLocalizedValue = (value: string, type: 'color' | 'area' | 'university' | 'field'): string => {
    const translationsMap = 
      type === 'color' ? translations.colors :
      type === 'area' ? translations.areas :
      type === 'university' ? translations.universities :
      translations.fields;
    
    const translation = translationsMap[value];
    return translation?.[locale] || value;
  };

  return {
    id: idNum,
    vari: vari ? getLocalizedValue(vari, 'color') : "",
    hex: metadata.hex ?? "",
    alue: alue ? getLocalizedValue(alue, 'area') : "",
    ala: ala ? ala.split(', ').map((f: string) => {
      const field = f.trim();
      return getLocalizedValue(field, 'field');
    }).join(', ') : null,
    ainejärjestö: content.ainejärjestö || null,
    oppilaitos: oppilaitos ? getLocalizedValue(oppilaitos, 'university') : "",
  };
}

export async function loadUniversities(locale: 'fi' | 'en' | 'sv' = 'fi'): Promise<University[]> {
  const jsonFilePath = path.join(process.cwd(), "data", "overall_colors_upstash.json");

  try {
    const translations = await loadTranslations();
    const json = await fs.readFile(jsonFilePath, "utf-8");
    const universities = (JSON.parse(json) as any[])
      .map(row => normalizeJsonToUniversity(row, locale, translations))
      .filter(Boolean) as University[];
    return universities;
  } catch (error) {
    console.error("Failed to load universities:", error);
    return [];
  }
}
