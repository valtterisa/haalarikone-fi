import type { University } from '@/types/university';

export function getUniqueUniversities(universities: University[]): string[] {
  return Array.from(new Set(universities.map((u) => u.oppilaitos))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getUniqueFields(universities: University[]): string[] {
  const fields = new Set<string>();
  universities.forEach((u) => {
    if (u.ala) {
      u.ala.split(', ').forEach((field) => {
        fields.add(field.trim());
      });
    }
  });
  return Array.from(fields).sort((a, b) => a.localeCompare(b));
}

export function getUniqueColors(universities: University[]): string[] {
  const colors = new Set<string>();
  universities.forEach((u) => {
    if (u.variBase?.length) {
      u.variBase.forEach((b) => colors.add(b));
    } else if (u.vari) {
      colors.add(u.vari);
    }
  });
  return Array.from(colors).sort((a, b) => a.localeCompare(b));
}

export function getUniqueAreas(universities: University[]): string[] {
  const areas = new Set<string>();
  universities.forEach((u) => {
    if (u.alue) {
      u.alue.split(', ').forEach((area) => {
        areas.add(area.trim());
      });
    }
  });
  return Array.from(areas).sort((a, b) => a.localeCompare(b));
}
