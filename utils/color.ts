export function parseHexFromMetadata(hexString: string): string | null {
  const hexMatch = hexString.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
  if (hexMatch) return hexMatch[0];

  const bgMatch = hexString.match(/background:\s*([a-zA-Z]+)/);
  if (!bgMatch) return null;

  const name = bgMatch[1].toLowerCase();
  const cssToHex: Record<string, string> = {
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
  };

  return cssToHex[name] ?? null;
}
