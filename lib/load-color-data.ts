import { parseHexFromMetadata } from '@/utils/color';
import universitiesData from '@/data/overall_colors_upstash.json';
import translationsData from '@/data/translations.json';

export type ColorData = {
  colors: {
    [key: string]: {
      color: string;
      main: string[];
      shades: string[];
    };
  };
  hexByAlias?: Record<string, string>;
};

let colorDataCache: ColorData | null = null;

export async function loadColorData(): Promise<ColorData> {
  if (colorDataCache) {
    return colorDataCache;
  }

  const universities = universitiesData as Array<{
    content: {
      vari: string | { base?: string | string[]; label?: string };
    };
    metadata?: { hex?: string };
  }>;

  const colorVariants = new Map<string, Set<string>>();
  const colorHexMap = new Map<string, string>();
  const aliasHexMap = new Map<string, string>();
  const translations = translationsData as {
    colors: Record<string, { fi: string; en: string; sv: string }>;
  };
  const colorTranslations = translations.colors;

  const normalizeBaseColorKeyInline = (key: string): string | null => {
    const k = key.toLowerCase().trim();
    if (!k) return null;
    if (k === 'valkoinen' || k === 'white') return 'valkoinen';
    if (k === 'musta' || k === 'black') return 'musta';
    if (k === 'punainen' || k === 'red') return 'punainen';
    if (k === 'sininen' || k === 'blue' || k === 'navy' || k === 'navy blue') return 'sininen';
    if (k === 'vihreä' || k === 'green') return 'vihreä';
    if (k === 'keltainen' || k === 'yellow') return 'keltainen';
    if (k === 'oranssi' || k === 'orange') return 'oranssi';
    if (k === 'violetti' || k === 'liila' || k === 'purple') return 'violetti';
    if (k === 'pinkki' || k === 'pink') return 'pinkki';
    if (k === 'harmaa' || k === 'gray' || k === 'grey') return 'harmaa';
    if (k === 'ruskea' || k === 'brown') return 'ruskea';
    if (k === 'turkoosi' || k === 'turquoise' || k === 'teal' || k === 'cyan') return 'turkoosi';
    return null;
  };

  const inferBaseColorsFromLabelInline = (label: string): string[] => {
    const s = label.toLowerCase();
    if (!s.trim()) return [];
    const out = new Set<string>();
    const addIf = (token: string, base: string) => {
      if (s.includes(token)) out.add(base);
    };

    addIf('valkoinen', 'valkoinen');
    addIf('white', 'valkoinen');

    addIf('musta', 'musta');
    addIf('black', 'musta');

    addIf('punainen', 'punainen');
    addIf('red', 'punainen');

    addIf('sininen', 'sininen');
    addIf('blue', 'sininen');
    addIf('navy', 'sininen');

    addIf('vihreä', 'vihreä');
    addIf('green', 'vihreä');

    addIf('keltainen', 'keltainen');
    addIf('yellow', 'keltainen');

    addIf('oranssi', 'oranssi');
    addIf('orange', 'oranssi');

    addIf('violetti', 'violetti');
    addIf('liila', 'violetti');
    addIf('purple', 'violetti');

    addIf('pinkki', 'pinkki');
    addIf('pink', 'pinkki');

    addIf('harmaa', 'harmaa');
    addIf('gray', 'harmaa');
    addIf('grey', 'harmaa');

    addIf('ruskea', 'ruskea');
    addIf('brown', 'ruskea');

    addIf('turkoosi', 'turkoosi');
    addIf('turquoise', 'turkoosi');
    addIf('teal', 'turkoosi');
    addIf('cyan', 'turkoosi');

    return Array.from(out);
  };

  for (const uni of universities) {
    const rawVari = uni.content.vari;

    let label = '';
    let bases: string[] = [];

    if (typeof rawVari === 'string') {
      label = rawVari;
      bases = inferBaseColorsFromLabelInline(rawVari);
    } else if (rawVari && typeof rawVari === 'object') {
      label = rawVari.label ?? (typeof rawVari.base === 'string' ? rawVari.base : '') ?? '';
      const baseRaw = rawVari.base;
      if (typeof baseRaw === 'string') bases = [baseRaw];
      else if (Array.isArray(baseRaw)) bases = baseRaw;
      else bases = inferBaseColorsFromLabelInline(label);
    }

    const colorName = label.toLowerCase().trim();
    if (!colorName) continue;

    const rawHex = uni.metadata?.hex;
    if (rawHex && !colorHexMap.has(colorName)) {
      const parsed = parseHexFromMetadata(rawHex);
      if (parsed) {
        colorHexMap.set(colorName, parsed);
      }
    }

    const normalizedBases = Array.from(
      new Set(
        bases
          .map((b) => normalizeBaseColorKeyInline(String(b)))
          .filter((b): b is string => Boolean(b)),
      ),
    );

    for (const baseColor of normalizedBases) {
      if (!colorVariants.has(baseColor)) {
        colorVariants.set(baseColor, new Set());
      }
      colorVariants.get(baseColor)!.add(colorName);
    }
  }

  const colors: ColorData['colors'] = {};
  const baseColorKeys = Array.from(colorVariants.keys());

  for (const baseColor of baseColorKeys) {
    const variants = colorVariants.get(baseColor)!;
    const variantArray = Array.from(variants);
    const mainColorName = getMainColorName(baseColor);
    const hex = colorHexMap.get(mainColorName) ?? getDefaultHex(baseColor);
    const aliases = new Set<string>([baseColor, mainColorName, ...variantArray]);
    const expandedAliases = new Set<string>();

    aliases.forEach((alias) => {
      const normalizedAlias = alias.toLowerCase().trim();
      if (!normalizedAlias) return;
      expandedAliases.add(normalizedAlias);
      const translation = colorTranslations[normalizedAlias];
      if (translation) {
        expandedAliases.add(translation.fi.toLowerCase().trim());
        expandedAliases.add(translation.en.toLowerCase().trim());
        expandedAliases.add(translation.sv.toLowerCase().trim());
      }
    });

    expandedAliases.forEach((alias) => {
      if (!aliasHexMap.has(alias)) {
        aliasHexMap.set(alias, hex);
      }
    });

    colors[baseColor] = {
      color: hex,
      main: variantArray.filter((v) => v === mainColorName),
      shades: variantArray.filter((v) => v !== mainColorName),
    };
  }

  colorDataCache = { colors, hexByAlias: Object.fromEntries(aliasHexMap.entries()) };
  return colorDataCache;
}

function getMainColorName(baseColorKey: string): string {
  const mainColors: Record<string, string> = {
    valkoinen: 'valkoinen',
    musta: 'musta',
    punainen: 'punainen',
    sininen: 'sininen',
    vihreä: 'vihreä',
    keltainen: 'keltainen',
    oranssi: 'oranssi',
    violetti: 'violetti',
    harmaa: 'harmaa',
    ruskea: 'ruskea',
    turkoosi: 'turkoosi',
    pinkki: 'pinkki',
  };
  return mainColors[baseColorKey] || baseColorKey;
}

function getDefaultHex(colorKey: string): string {
  const defaults: Record<string, string> = {
    valkoinen: '#FFFFFF',
    musta: '#000000',
    punainen: '#EE4B2B',
    sininen: '#5179E1',
    vihreä: '#00A000',
    keltainen: '#FFD700',
    oranssi: '#FFAC1C',
    violetti: '#7F00FF',
    pinkki: '#FF69B4',
    harmaa: '#A6A6A6',
    ruskea: '#8B5A2B',
    turkoosi: '#00CED1',
  };
  return defaults[colorKey] || '#CCCCCC';
}
