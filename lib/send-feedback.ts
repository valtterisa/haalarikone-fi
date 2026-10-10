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
    console.error('DISCORD_FEEDBACK_WEBHOOK_URL is not configured. Feedback submission failed.');
    throw new Error('Feedback service is not configured');
  }

  await sendFeedbackDiscord(validated);
}
