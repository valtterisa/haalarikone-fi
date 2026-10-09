import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sendFeedbackDiscord', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('posts an embed to the configured webhook', async () => {
    vi.stubEnv('DISCORD_FEEDBACK_WEBHOOK_URL', 'https://discord.test/webhook');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { sendFeedbackDiscord } = await import('@/lib/send-feedback-discord');

    await sendFeedbackDiscord({
      type: 'correction',
      message: 'Wrong color for this organization',
      email: 'user@example.com',
      sourceId: '42',
      sourceName: 'Skripti',
      pageUrl: 'https://haalarikone.fi/fi/haalari/skripti',
      origin: 'https://haalarikone.fi',
      referer: null,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://discord.test/webhook');
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body)) as {
      embeds: Array<{ title: string; fields: Array<{ name: string; value: string }> }>;
    };
    expect(body.embeds[0]?.title).toBe('Korjauspyyntö');
    expect(body.embeds[0]?.fields.some((field) => field.name === 'Kohde')).toBe(true);
  });

  it('no-ops when webhook is not configured', async () => {
    vi.stubEnv('DISCORD_FEEDBACK_WEBHOOK_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { sendFeedbackDiscord } = await import('@/lib/send-feedback-discord');

    await sendFeedbackDiscord({
      type: 'general',
      message: 'Just saying hello here',
      email: null,
      sourceId: null,
      sourceName: null,
      pageUrl: null,
      origin: null,
      referer: null,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
