import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sendFeedbackDiscord', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('posts an embed to the configured webhook', async () => {
    vi.stubEnv('DISCORD_FEEDBACK_WEBHOOK_URL', 'https://discord.test/webhook');
    vi.stubEnv('DISCORD_BOT_TOKEN', '');
    vi.stubEnv('DISCORD_FEEDBACK_CHANNEL_ID', '');
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
      allowed_mentions: { parse: string[] };
      embeds: Array<{ title: string; fields: Array<{ name: string; value: string }> }>;
      components?: unknown;
    };
    expect(body.allowed_mentions).toEqual({ parse: [] });
    expect(body.embeds[0]?.title).toBe('Korjauspyyntö');
    expect(body.embeds[0]?.fields.some((field) => field.name === 'Kohde')).toBe(true);
    expect(body.components).toBeUndefined();
  });

  it('posts a bot message with Luo draft-PR button for correction and general', async () => {
    vi.stubEnv('DISCORD_FEEDBACK_WEBHOOK_URL', '');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.stubEnv('DISCORD_FEEDBACK_CHANNEL_ID', '111');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { sendFeedbackDiscord } = await import('@/lib/send-feedback-discord');

    for (const type of ['correction', 'general'] as const) {
      fetchMock.mockClear();
      await sendFeedbackDiscord({
        type,
        message: 'Wrong color for this organization',
        email: null,
        sourceId: '42',
        sourceName: 'Skripti',
        pageUrl: 'https://haalarikone.fi/fi/haalari/skripti',
        origin: 'https://haalarikone.fi',
        referer: null,
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(String(init.body)) as {
        components: Array<{ components: Array<{ custom_id: string; label: string }> }>;
        embeds: Array<{ footer: { text: string } }>;
      };
      expect(body.components[0]?.components[0]?.label).toBe('Luo draft-PR');
      expect(body.components[0]?.components[0]?.custom_id).toBe('haalarikone:cursor_pr');
      expect(body.embeds[0]?.footer.text).toContain('v1.');
    }
  });

  it('falls back to webhook when bot post fails', async () => {
    vi.stubEnv('DISCORD_FEEDBACK_WEBHOOK_URL', 'https://discord.test/webhook');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.stubEnv('DISCORD_FEEDBACK_CHANNEL_ID', '111');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Missing Access',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });
    vi.stubGlobal('fetch', fetchMock);

    const { sendFeedbackDiscord } = await import('@/lib/send-feedback-discord');

    await sendFeedbackDiscord({
      type: 'correction',
      message: 'Wrong color for this organization',
      email: null,
      sourceId: '42',
      sourceName: 'Skripti',
      pageUrl: 'https://haalarikone.fi/fi/haalari/skripti',
      origin: 'https://haalarikone.fi',
      referer: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('discord.com/api/v10/channels/111/messages');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://discord.test/webhook');
  });

  it('no-ops when webhook is not configured and bot is missing', async () => {
    vi.stubEnv('DISCORD_FEEDBACK_WEBHOOK_URL', '');
    vi.stubEnv('DISCORD_BOT_TOKEN', '');
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
