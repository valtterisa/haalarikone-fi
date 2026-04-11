import type { ColorData } from './load-color-data';
import type { QueryUnderstanding } from './query-understanding';

export function parseSimpleQueryWithColorData(
  query: string,
  colorData: ColorData,
): QueryUnderstanding | null {
  const lower = query.toLowerCase().trim();
  const words = lower.split(/\s+/).filter((w) => w.length > 1);

  if (words.length === 0 || words.length > 2) return null;

  let detectedColor: string | null = null;

  for (const word of words) {
    for (const colorInfo of Object.values(colorData.colors)) {
      const allVariants = [...colorInfo.main, ...colorInfo.shades];
      if (allVariants.some((c) => c.toLowerCase() === word)) {
        detectedColor = word;
        break;
      }
    }
    if (detectedColor) break;
  }

  if (detectedColor && words.length <= 2) {
    return {
      isGibberish: false,
      filters: {
        color: detectedColor,
        area: undefined,
        field: undefined,
        school: undefined,
        organization: undefined,
      },
      semanticQuery: words.length === 2 ? words.find((w) => w !== detectedColor) || '' : '',
    };
  }

  return null;
}
