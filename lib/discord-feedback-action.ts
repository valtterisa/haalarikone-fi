import { createHmac, timingSafeEqual } from 'node:crypto';

import type { FeedbackPayload } from '@/lib/feedback-schema';

const SIG_PREFIX = 'v1.';

export type DiscordFeedbackActionPayload = {
  type: FeedbackPayload['type'];
  message: string;
  sourceId: string | null;
  sourceName: string | null;
  pageUrl: string | null;
};

function signingSecret(): string | null {
  return process.env.CURSOR_AUTOMATION_WEBHOOK_KEY || null;
}

function canonical(payload: DiscordFeedbackActionPayload): string {
  return [
    payload.type,
    payload.message,
    payload.sourceId ?? '',
    payload.sourceName ?? '',
    payload.pageUrl ?? '',
  ].join('\n');
}

export function signDiscordFeedbackAction(payload: DiscordFeedbackActionPayload): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const digest = createHmac('sha256', secret).update(canonical(payload)).digest('base64url');
  return `${SIG_PREFIX}${digest}`;
}

export function verifyDiscordFeedbackAction(
  payload: DiscordFeedbackActionPayload,
  signature: string,
): boolean {
  const secret = signingSecret();
  if (!secret || !signature.startsWith(SIG_PREFIX)) return false;
  const expected = signDiscordFeedbackAction(payload);
  if (!expected) return false;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseFeedbackFromDiscordEmbed(embed: {
  title?: string | null;
  footer?: { text?: string | null } | null;
  fields?: Array<{ name: string; value: string }> | null;
}): { payload: DiscordFeedbackActionPayload; signature: string } | null {
  const fields = embed.fields ?? [];
  const byName = new Map(fields.map((field) => [field.name, field.value]));
  const message = byName.get('Viesti');
  if (!message) return null;

  const title = embed.title ?? '';
  const type: FeedbackPayload['type'] = title.includes('Korjaus') ? 'correction' : 'general';
  const footer = embed.footer?.text ?? '';
  const sigMatch = footer.match(/\bv1\.[A-Za-z0-9_-]+\b/);
  if (!sigMatch) return null;

  const payload: DiscordFeedbackActionPayload = {
    type,
    message,
    sourceId: byName.get('Kohteen ID') ?? null,
    sourceName: byName.get('Kohde') ?? null,
    pageUrl: byName.get('Sivu') ?? null,
  };

  return { payload, signature: sigMatch[0] };
}

export function toFeedbackPayload(payload: DiscordFeedbackActionPayload): FeedbackPayload {
  return {
    type: payload.type,
    message: payload.message,
    email: null,
    sourceId: payload.sourceId,
    sourceName: payload.sourceName,
    pageUrl: payload.pageUrl,
    origin: null,
    referer: null,
  };
}

/** True when the Discord bot can post feedback messages (button needs Cursor key separately). */
export function isDiscordBotFeedbackConfigured(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_FEEDBACK_CHANNEL_ID);
}

export const CURSOR_PR_BUTTON_CUSTOM_ID = 'haalarikone:cursor_pr';
