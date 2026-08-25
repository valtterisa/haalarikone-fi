import type { University } from '@/types/university';

export function getUniversitiesByUniversity(
  universities: University[],
  universityName: string,
): University[] {
  return universities.filter((u) => u.oppilaitos.toLowerCase() === universityName.toLowerCase());
}

export function getUniversitiesByField(
  universities: University[],
  fieldName: string,
): University[] {
  return universities.filter((u) => u.ala?.toLowerCase().includes(fieldName.toLowerCase()));
}

/**
 * `variBase` holds canonical (Finnish) base colors that are the same in every locale, while
 * `vari` holds the localized label. Callers on localized pages must therefore pass the localized
 * label plus the canonical base name, otherwise nothing matches outside `fi`.
 */
export function getUniversitiesByColor(
  universities: University[],
  colorName: string,
  baseColorName: string = colorName,
): University[] {
  const label = colorName.toLowerCase();
  const base = baseColorName.toLowerCase();
  return universities.filter(
    (u) =>
      (u.variBase?.some((b) => b.toLowerCase() === base) ?? false) ||
      u.vari.toLowerCase().includes(label),
  );
}

export function getUniversitiesByArea(universities: University[], areaName: string): University[] {
  return universities.filter((u) => u.alue?.toLowerCase().includes(areaName.toLowerCase()));
}
