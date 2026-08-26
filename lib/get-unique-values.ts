import type { University } from '@/types/university';
import { splitCsv } from '@/lib/popular-destinations';

export function getUniqueUniversities(universities: University[]): string[] {
  return Array.from(new Set(universities.map((u) => u.oppilaitos))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getUniqueFields(universities: University[]): string[] {
  const fields = new Set<string>();
  universities.forEach((u) => {
    for (const field of splitCsv(u.ala)) {
      fields.add(field);
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
    for (const area of splitCsv(u.alue)) {
      areas.add(area);
    }
  });
  return Array.from(areas).sort((a, b) => a.localeCompare(b));
}
