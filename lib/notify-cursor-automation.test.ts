import { afterEach, describe, expect, it, vi } from 'vitest';

const sampleCorrection = {
  type: 'correction' as const,
  message: 'Wrong color for this organization',
  email: 'user@example.com',
  sourceId: '42',
  sourceName: 'Skripti',
  pageUrl: 'https://haalarikone.fi/fi/haalari/skripti',
  origin: 'https://haalarikone.fi',
  referer: null,
};

describe('notifyCursorAutomation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('skips when not configured', async () => {
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_URL', '');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { notifyCursorAutomation } = await import('@/lib/notify-cursor-automation');
    const result = await notifyCursorAutomation(sampleCorrection);

    expect(result).toEqual({ ok: true, skipped: true, reason: 'not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows general feedback by default', async () => {
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_URL', 'https://cursor.test/webhook');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { notifyCursorAutomation } = await import('@/lib/notify-cursor-automation');
    const result = await notifyCursorAutomation({
      ...sampleCorrection,
      type: 'general',
      message: 'Love the site, keep going!',
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('skips types outside CURSOR_AUTOMATION_FEEDBACK_TYPES', async () => {
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_URL', 'https://cursor.test/webhook');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    vi.stubEnv('CURSOR_AUTOMATION_FEEDBACK_TYPES', 'correction');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { notifyCursorAutomation } = await import('@/lib/notify-cursor-automation');
    const result = await notifyCursorAutomation({
      ...sampleCorrection,
      type: 'general',
      message: 'Love the site, keep going!',
    });

    expect(result).toEqual({ ok: true, skipped: true, reason: 'type_filtered' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts correction feedback to the Cursor webhook', async () => {
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_URL', 'https://cursor.test/webhook');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { notifyCursorAutomation } = await import('@/lib/notify-cursor-automation');
    const result = await notifyCursorAutomation(sampleCorrection);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://cursor.test/webhook');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-key',
    });
    const body = JSON.parse(String(init.body)) as {
      event: string;
      repo: string;
      feedback: { type: string; message: string; email?: string };
    };
    expect(body.event).toBe('haalarikone.feedback');
    expect(body.repo).toBe('valtterisa/haalarikone-fi');
    expect(body.feedback.type).toBe('correction');
    expect(body.feedback.message).toContain('Wrong color');
    expect(body.feedback.email).toBeUndefined();
  });

  it('returns ok:false on HTTP failure without throwing', async () => {
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_URL', 'https://cursor.test/webhook');
    vi.stubEnv('CURSOR_AUTOMATION_WEBHOOK_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'unauthorized',
      }),
    );

    const { notifyCursorAutomation } = await import('@/lib/notify-cursor-automation');
    const result = await notifyCursorAutomation(sampleCorrection);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('401');
    }
  });
});
