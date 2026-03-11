import { promises as fs } from 'fs';
import path from 'path';
import { parseHexFromMetadata } from '@/utils/color';

export type ColorData = {
  colors: {
    [key: string]: {
      color: string;
      main: string[];
      shades: string[];
    };
  };
};

let colorDataCache: ColorData | null = null;

export async function loadColorData(): Promise<ColorData> {
  if (colorDataCache) {
    return colorDataCache;
  }

  const jsonFilePath = path.join(process.cwd(), 'data', 'overall_colors_upstash.json');
  const json = await fs.readFile(jsonFilePath, 'utf-8');
  const universities = JSON.parse(json) as Array<{
    content: { vari: string };
    metadata?: { hex?: string };
  }>;

  const colorVariants = new Map<string, Set<string>>();
  const colorHexMap = new Map<string, string>();

  for (const uni of universities) {
    const colorName = uni.content.vari?.toLowerCase().trim();
    if (!colorName) continue;

    const rawHex = uni.metadata?.hex;
    if (rawHex && !colorHexMap.has(colorName)) {
      const parsed = parseHexFromMetadata(rawHex);
      if (parsed) {
        colorHexMap.set(colorName, parsed);
      }
    }

    const baseColor = getBaseColorKey(colorName);
    if (!colorVariants.has(baseColor)) {
      colorVariants.set(baseColor, new Set());
    }
    colorVariants.get(baseColor)!.add(colorName);
  }

  const colors: ColorData['colors'] = {};
  const baseColorKeys = Array.from(colorVariants.keys());

  for (const baseColor of baseColorKeys) {
    const variants = colorVariants.get(baseColor)!;
    const variantArray = Array.from(variants);
    const mainColorName = getMainColorName(baseColor);
    const hex = colorHexMap.get(mainColorName) ?? getDefaultHex(baseColor);

    colors[baseColor] = {
      color: hex,
      main: variantArray.filter((v) => v === mainColorName),
      shades: variantArray.filter((v) => v !== mainColorName),
    };
  }

  colorDataCache = { colors };
  return colorDataCache;
}

function getBaseColorKey(colorName: string): string {
  const baseColors: Record<string, string> = {
    valkoinen: 'white',
    musta: 'black',
    punainen: 'punainen',
    sininen: 'sininen',
    vihreä: 'vihreä',
    keltainen: 'keltainen',
    oranssi: 'oranssi',
    violetti: 'violetti',
    liila: 'violetti',
    pinkki: 'pinkki',
  };

  for (const [key, value] of Object.entries(baseColors)) {
    if (colorName.includes(key)) {
      return value;
    }
  }
  return colorName.split(/[\s-]+/)[0];
}

function getMainColorName(baseColorKey: string): string {
  const mainColors: Record<string, string> = {
    white: 'valkoinen',
    black: 'musta',
    punainen: 'punainen',
    sininen: 'sininen',
    vihreä: 'vihreä',
    keltainen: 'keltainen',
    oranssi: 'oranssi',
    violetti: 'violetti',
    pinkki: 'pinkki',
  };
  return mainColors[baseColorKey] || baseColorKey;
}

function getDefaultHex(colorKey: string): string {
  const defaults: Record<string, string> = {
    white: '#FFFFFF',
    black: '#000000',
    punainen: '#EE4B2B',
    sininen: '#5179E1',
    vihreä: '#00A000',
    keltainen: '#FFD700',
    oranssi: '#FFAC1C',
    violetti: '#7F00FF',
    pinkki: '#FF69B4',
  };
  return defaults[colorKey] || '#CCCCCC';
}
