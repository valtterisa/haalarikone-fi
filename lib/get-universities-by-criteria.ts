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

export function getUniversitiesByColor(
  universities: University[],
  colorName: string,
): University[] {
  return universities.filter(
    (u) =>
      (u.variBase?.some((b) => b.toLowerCase() === colorName.toLowerCase()) ?? false) ||
      u.vari.toLowerCase().includes(colorName.toLowerCase()),
  );
}

export function getUniversitiesByArea(universities: University[], areaName: string): University[] {
  return universities.filter((u) => u.alue?.toLowerCase().includes(areaName.toLowerCase()));
}
