import { afterEach, describe, expect, it, vi } from 'vitest';

describe('discord-feedback-action', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('signs and verifies embed payloads', async () => {
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    const {
      signDiscordFeedbackAction,
      verifyDiscordFeedbackAction,
      parseFeedbackFromDiscordEmbed,
    } = await import('@/lib/discord-feedback-action');

    const payload = {
      type: 'correction' as const,
      message: 'Wrong color for this organization',
      sourceId: '42',
      sourceName: 'Skripti',
      pageUrl: 'https://haalarikone.fi/fi/haalari/skripti',
    };
    const signature = signDiscordFeedbackAction(payload);
    expect(signature).toMatch(/^v1\./);
    expect(verifyDiscordFeedbackAction(payload, signature!)).toBe(true);
    expect(verifyDiscordFeedbackAction(payload, 'v1.tampered')).toBe(false);

    const parsed = parseFeedbackFromDiscordEmbed({
      title: 'Korjauspyyntö',
      footer: { text: `Haalarikone palaute · ${signature}` },
      fields: [
        { name: 'Viesti', value: payload.message },
        { name: 'Kohde', value: 'Skripti' },
        { name: 'Kohteen ID', value: '42' },
        { name: 'Sivu', value: payload.pageUrl },
      ],
    });
    expect(parsed?.payload.sourceId).toBe('42');
    expect(verifyDiscordFeedbackAction(parsed!.payload, parsed!.signature)).toBe(true);
  });
});
