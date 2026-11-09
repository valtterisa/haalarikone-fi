import type { FeedbackPayload } from '@/lib/feedback-schema';

const webhookUrl = process.env.CURSOR_AUTOMATION_WEBHOOK_URL;
const webhookKey = process.env.CURSOR_AUTOMATION_WEBHOOK_KEY;

/** Comma-separated feedback types that wake the Cursor automation. Default: correction only. */
function allowedTypes(): Set<FeedbackPayload['type']> {
  const raw = process.env.CURSOR_AUTOMATION_FEEDBACK_TYPES ?? 'correction';
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean) as FeedbackPayload['type'][],
  );
}

export function isCursorAutomationConfigured(): boolean {
  return Boolean(webhookUrl && webhookKey);
}

export type CursorAutomationNotifyResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: 'not_configured' | 'type_filtered' }
  | { ok: false; error: string };

/**
 * Wakes a Cursor Automation (webhook trigger) so a Cloud Agent can open a PR.
 * Failures are returned, never thrown — feedback delivery must not depend on Cursor.
 */
export async function notifyCursorAutomation(
  payload: FeedbackPayload,
): Promise<CursorAutomationNotifyResult> {
  if (!webhookUrl || !webhookKey) {
    return { ok: true, skipped: true, reason: 'not_configured' };
  }

  if (!allowedTypes().has(payload.type)) {
    return { ok: true, skipped: true, reason: 'type_filtered' };
  }

  const body = {
    event: 'haalarikone.feedback',
    source: 'haalarikone',
    repo: 'valtterisa/student-overall-app',
    feedback: {
      type: payload.type,
      message: payload.message,
      sourceId: payload.sourceId,
      sourceName: payload.sourceName,
      pageUrl: payload.pageUrl,
      // Intentionally omit email / referer — not needed for code changes.
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        ok: false,
        error: `Cursor automation webhook failed (${response.status}): ${text.slice(0, 200)}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Cursor automation webhook failed',
    };
  }
}
