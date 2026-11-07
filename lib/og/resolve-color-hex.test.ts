import { describe, expect, it } from 'vitest';
import {
  normalizeHex,
  resolveColorHex,
  textOnColor,
  uniqueSwatches,
} from '@/lib/og/resolve-color-hex';

describe('resolveColorHex', () => {
  it('parses hex from CSS metadata strings', () => {
    expect(resolveColorHex('background: #14780a; color: white;')).toBe('#14780A');
  });

  it('parses named CSS background colors', () => {
    expect(resolveColorHex('background: indigo; color: white;')).toBe('#4B0082');
    expect(resolveColorHex('background: pink;')).toBe('#FFC0CB');
  });

  it('falls back for empty input', () => {
    expect(resolveColorHex('')).toBe('#65A30D');
    expect(resolveColorHex(null)).toBe('#65A30D');
  });

  it('normalizes short hex', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
  });
});

describe('textOnColor', () => {
  it('uses dark text on light swatches and light text on dark ones', () => {
    expect(textOnColor('#FFFFFF')).toBe('#1A1814');
    expect(textOnColor('#FFD700')).toBe('#1A1814');
    expect(textOnColor('#14780A')).toBe('#FFFFFF');
    expect(textOnColor('#000000')).toBe('#FFFFFF');
  });
});

describe('uniqueSwatches', () => {
  it('dedupes and respects the limit', () => {
    expect(
      uniqueSwatches(
        [
          'background: #14780a;',
          'background: #14780a;',
          'background: indigo;',
          'background: pink;',
        ],
        2,
      ),
    ).toEqual(['#14780A', '#4B0082']);
  });
});
