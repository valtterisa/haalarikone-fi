import { describe, expect, it } from 'vitest';
import { feedbackSchema, truncateDiscordField } from '@/lib/feedback-schema';

describe('feedbackSchema', () => {
  it('accepts general feedback', () => {
    const parsed = feedbackSchema.parse({
      type: 'general',
      message: 'This is long enough feedback',
      email: null,
      sourceId: null,
      sourceName: 'footer',
      pageUrl: 'https://haalarikone.fi/fi',
      origin: 'https://haalarikone.fi',
      referer: null,
    });
    expect(parsed.type).toBe('general');
  });

  it('accepts correction feedback with source', () => {
    const parsed = feedbackSchema.parse({
      type: 'correction',
      message: 'Wrong overall color for this org',
      email: 'test@example.com',
      sourceId: '123',
      sourceName: 'Skripti · hopeanharmaa · Itä-Suomen yliopisto',
      pageUrl: 'https://haalarikone.fi/fi/haalari/skripti',
      origin: 'https://haalarikone.fi',
      referer: null,
    });
    expect(parsed.type).toBe('correction');
    expect(parsed.email).toBe('test@example.com');
  });

  it('rejects short messages', () => {
    expect(() =>
      feedbackSchema.parse({
        type: 'general',
        message: 'too short',
        email: null,
        sourceId: null,
        sourceName: null,
        pageUrl: null,
        origin: null,
        referer: null,
      }),
    ).toThrow();
  });
});

describe('truncateDiscordField', () => {
  it('keeps short values intact', () => {
    expect(truncateDiscordField('hello', 10)).toBe('hello');
  });

  it('truncates long values with ellipsis', () => {
    expect(truncateDiscordField('abcdefghij', 5)).toBe('abcd…');
  });
});
