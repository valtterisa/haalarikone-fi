import { describe, expect, it } from 'vitest';
import { emptyToNull, logSearchBodySchema } from '@/lib/log-search-schema';

describe('logSearchBodySchema', () => {
  it('accepts a text query of at least 3 chars', () => {
    const parsed = logSearchBodySchema.safeParse({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 12,
      source: 'modal',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts filter-only payloads', () => {
    const parsed = logSearchBodySchema.safeParse({
      query: '',
      locale: 'en',
      resultCount: 4,
      source: 'listing',
      color: 'punainen',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty query with no filters', () => {
    const parsed = logSearchBodySchema.safeParse({
      query: 'ab',
      locale: 'fi',
      resultCount: 0,
      source: 'listing',
    });
    expect(parsed.success).toBe(false);
  });

  it('trims query and filters', () => {
    const parsed = logSearchBodySchema.safeParse({
      query: '  helsinki  ',
      locale: 'sv',
      resultCount: 1,
      source: 'listing',
      area: '  Helsinki  ',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.query).toBe('helsinki');
    expect(parsed.data.area).toBe('Helsinki');
  });
});

describe('emptyToNull', () => {
  it('turns blank strings into null', () => {
    expect(emptyToNull('')).toBeNull();
    expect(emptyToNull('   ')).toBeNull();
    expect(emptyToNull(null)).toBeNull();
    expect(emptyToNull('punainen')).toBe('punainen');
  });
});
