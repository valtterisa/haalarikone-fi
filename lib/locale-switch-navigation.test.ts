import { describe, expect, it } from 'vitest';
import { resolveLocaleSwitchHref } from '@/lib/locale-switch-navigation';

describe('resolveLocaleSwitchHref', () => {
  it('translates area slugs from finnish pathname keys (next-intl usePathname)', () => {
    expect(resolveLocaleSwitchHref('/alue/oulu', { slug: 'oulu' }, 'fi', 'sv')).toEqual({
      pathname: '/alue/[slug]',
      params: { slug: 'uleaborg' },
    });

    expect(resolveLocaleSwitchHref('/alue/uleaborg', { slug: 'uleaborg' }, 'sv', 'fi')).toEqual({
      pathname: '/alue/[slug]',
      params: { slug: 'oulu' },
    });

    expect(resolveLocaleSwitchHref('/alue/oulu', { slug: 'oulu' }, 'en', 'sv')).toEqual({
      pathname: '/alue/[slug]',
      params: { slug: 'uleaborg' },
    });
  });

  it('accepts localized first segments when present', () => {
    expect(
      resolveLocaleSwitchHref('/regioner/uleaborg', { slug: 'uleaborg' }, 'sv', 'fi'),
    ).toEqual({
      pathname: '/alue/[slug]',
      params: { slug: 'oulu' },
    });

    expect(resolveLocaleSwitchHref('/areas/oulu', { slug: 'oulu' }, 'en', 'sv')).toEqual({
      pathname: '/alue/[slug]',
      params: { slug: 'uleaborg' },
    });
  });

  it('recovers when the slug belongs to another locale', () => {
    expect(resolveLocaleSwitchHref('/alue/uleaborg', { slug: 'uleaborg' }, 'fi', 'en')).toEqual({
      pathname: '/alue/[slug]',
      params: { slug: 'oulu' },
    });
  });

  it('resolves index hubs from internal pathname keys', () => {
    expect(resolveLocaleSwitchHref('/alue', {}, 'sv', 'fi')).toBe('/alue');
    expect(resolveLocaleSwitchHref('/areas', {}, 'en', 'sv')).toBe('/alue');
  });

  it('translates blog slugs between locales', () => {
    expect(
      resolveLocaleSwitchHref('/blog/koodaripula-it-taidot', { slug: 'koodaripula-it-taidot' }, 'fi', 'en'),
    ).toEqual({
      pathname: '/blog/[slug]',
      params: { slug: 'koodaripula-it-skills' },
    });

    expect(
      resolveLocaleSwitchHref('/blog/koodaripula-it-skills', { slug: 'koodaripula-it-skills' }, 'en', 'fi'),
    ).toEqual({
      pathname: '/blog/[slug]',
      params: { slug: 'koodaripula-it-taidot' },
    });
  });
});
