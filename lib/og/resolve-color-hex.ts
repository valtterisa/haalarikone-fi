import { parseHexFromMetadata } from '@/utils/color';

const NAMED_CSS_COLORS: Record<string, string> = {
  red: '#FF0000',
  darkred: '#8B0000',
  blue: '#0000FF',
  navy: '#000080',
  white: '#FFFFFF',
  black: '#000000',
  yellow: '#FFFF00',
  pink: '#FFC0CB',
  deeppink: '#FF1493',
  indigo: '#4B0082',
  darkorange: '#FF8C00',
  olive: '#808000',
  lightgrey: '#D3D3D3',
  dimgrey: '#696969',
  silver: '#C0C0C0',
  green: '#008000',
  purple: '#800080',
  orange: '#FFA500',
  gray: '#808080',
  grey: '#808080',
  cyan: '#00FFFF',
  teal: '#008080',
  turquoise: '#40E0D0',
};

const FALLBACK_HEX = '#65A30D';

/** Resolve a solid hex from overall metadata / CSS-like background strings. */
export function resolveColorHex(raw: string | null | undefined): string {
  if (!raw?.trim()) return FALLBACK_HEX;

  const fromParser = parseHexFromMetadata(raw);
  if (fromParser) return normalizeHex(fromParser);

  const bgMatch = raw.match(/background(?:-color)?:\s*([^;]+)/i);
  if (bgMatch) {
    const value = bgMatch[1].trim().toLowerCase();
    if (value.startsWith('#')) return normalizeHex(value);
    if (NAMED_CSS_COLORS[value]) return NAMED_CSS_COLORS[value];
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith('#')) return normalizeHex(trimmed);

  const named = NAMED_CSS_COLORS[trimmed.toLowerCase()];
  if (named) return named;

  return FALLBACK_HEX;
}

export function normalizeHex(hex: string): string {
  const cleaned = hex.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(cleaned)) {
    const [, r, g, b] = cleaned;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  return FALLBACK_HEX;
}

/** Relative luminance contrast pick for text sitting on a solid swatch. */
export function textOnColor(hex: string): '#FFFFFF' | '#1A1814' {
  const normalized = normalizeHex(hex).slice(1);
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? '#1A1814' : '#FFFFFF';
}

export function uniqueSwatches(hexes: Array<string | null | undefined>, limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of hexes) {
    const hex = resolveColorHex(raw);
    if (seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
    if (out.length >= limit) break;
  }
  return out;
}
