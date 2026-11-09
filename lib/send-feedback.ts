'use server';

import { feedbackSchema, type FeedbackPayload } from '@/lib/feedback-schema';
import { isDiscordFeedbackConfigured, sendFeedbackDiscord } from '@/lib/send-feedback-discord';

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  const result = feedbackSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('Invalid feedback data');
  }

  const validated = result.data;
  if (validated.honeypot) {
    return;
  }

  if (!isDiscordFeedbackConfigured()) {
    console.error(
      'Discord feedback is not configured (set DISCORD_BOT_TOKEN + DISCORD_FEEDBACK_CHANNEL_ID or DISCORD_FEEDBACK_WEBHOOK_URL).',
    );
    throw new Error('Feedback service is not configured');
  }

  await sendFeedbackDiscord(validated);
}
