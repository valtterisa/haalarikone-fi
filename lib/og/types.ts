import type { Locale } from '@/lib/slug-translations';

export const OG_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_CONTENT_TYPE = 'image/png';

export type OrganizationOgPayload = {
  kind: 'organization';
  locale: Locale;
  title: string;
  university: string;
  area: string | null;
  field: string | null;
  colorLabel: string;
  colorHex: string;
  textOnColor: '#FFFFFF' | '#1A1814';
  brand: string;
  eyebrow: string;
  colorCaption: string;
};

export type UniversityOgPayload = {
  kind: 'university';
  locale: Locale;
  title: string;
  overallCount: number;
  overallCountLabel: string;
  colorCount: number;
  colorCountLabel: string;
  swatches: string[];
  brand: string;
  eyebrow: string;
};

export type OgPayload = OrganizationOgPayload | UniversityOgPayload;
