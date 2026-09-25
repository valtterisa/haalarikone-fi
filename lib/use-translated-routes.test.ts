import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_ORIGIN } from '@/lib/site-url';
import { absoluteUrl, routeHref } from '@/lib/use-translated-routes';
import { getPathname } from '@/i18n/routing';

function countLocaleSegments(url: string): number {
  return (url.match(/\/(fi|en|sv)(?=\/|$)/g) ?? []).length;
}

describe('absoluteUrl', () => {
  it('includes locale prefix once for en/sv', () => {
    const cases = [
      absoluteUrl('sv', routeHref('areas', 'vasa')),
      absoluteUrl('en', routeHref('areas', 'vaasa')),
      absoluteUrl('en', routeHref('fields', 'energia-ja-ymparistotekniikka')),
      absoluteUrl('fi', routeHref('fields', 'energia-ja-ymparistotekniikka')),
      absoluteUrl('sv', '/tietosuoja'),
      absoluteUrl('en', '/'),
      absoluteUrl('sv', '/'),
    ];

    for (const url of cases) {
      expect(url.startsWith(SITE_ORIGIN)).toBe(true);
      expect(url).not.toMatch(/\/(en|sv)\/(fi|en|sv)(\/|$)/);
      expect(countLocaleSegments(url)).toBeLessThanOrEqual(1);
    }

    expect(absoluteUrl('sv', routeHref('areas', 'vasa'))).toBe(`${SITE_ORIGIN}/sv/regioner/vasa`);
    expect(absoluteUrl('fi', routeHref('fields', 'energia-ja-ymparistotekniikka'))).toBe(
      `${SITE_ORIGIN}/ala/energia-ja-ymparistotekniikka`,
    );
  });

  it('documents the prepend-locale anti-pattern', () => {
    const path = getPathname({ locale: 'sv', href: routeHref('areas', 'vasa') as never });
    expect(`${SITE_ORIGIN}/sv${path}`).toBe(`${SITE_ORIGIN}/sv/sv/regioner/vasa`);
    expect(`${SITE_ORIGIN}/sv${path}`).not.toBe(absoluteUrl('sv', routeHref('areas', 'vasa')));
  });
});

describe('no double-prefix URL composition in app source', () => {
  function walkTsFiles(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '.next') continue;
        out.push(...walkTsFiles(full));
      } else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) {
        out.push(full);
      }
    }
    return out;
  }

  it('does not prepend locale onto getPathname/absoluteUrl paths', () => {
    const offenders: string[] = [];
    const patterns = [
      /`\$\{SITE_ORIGIN\}\/\$\{(?:locale|loc)\}/,
      /localeSiteBaseUrl/,
      /absoluteTranslatedRoute|absoluteHomeUrl|getTranslatedRoute|localizedPath/,
    ];

    for (const file of walkTsFiles(join(process.cwd(), 'app'))) {
      const src = readFileSync(file, 'utf8');
      if (patterns.some((p) => p.test(src))) {
        offenders.push(file.replace(process.cwd(), '').replace(/\\/g, '/'));
      }
    }

    expect(offenders).toEqual([]);
  });
});
