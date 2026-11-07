import { describe, expect, it } from 'vitest';
import { ogImageAlt, ogImageUrl } from '@/lib/og/og-image-url';

describe('ogImageUrl', () => {
  it('builds a stable query for organizations and universities', () => {
    expect(ogImageUrl('organization', 'lok-ry', 'fi')).toBe(
      '/api/og?kind=organization&slug=lok-ry&locale=fi',
    );
    expect(ogImageUrl('university', 'hameen-amk', 'en')).toBe(
      '/api/og?kind=university&slug=hameen-amk&locale=en',
    );
  });

  it('builds an accessible alt label', () => {
    expect(ogImageAlt('LOK ry')).toBe('LOK ry | Haalarikone');
  });
});
