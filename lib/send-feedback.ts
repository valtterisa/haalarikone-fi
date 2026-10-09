'use server';

import { feedbackSchema, type FeedbackPayload } from '@/lib/feedback-schema';
import { isDiscordFeedbackConfigured, sendFeedbackDiscord } from '@/lib/send-feedback-discord';
import { isFeedbackEmailConfigured, sendFeedbackEmail } from '@/lib/send-feedback-email';

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  const result = feedbackSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('Invalid feedback data');
  }

  const validated = result.data;
  if (validated.honeypot) {
    return;
  }

  const discordConfigured = isDiscordFeedbackConfigured();
  const emailConfigured = isFeedbackEmailConfigured();

  if (!discordConfigured && !emailConfigured) {
    console.log(
      'Neither DISCORD_FEEDBACK_WEBHOOK_URL nor Resend feedback email is configured. Feedback submission skipped.',
    );
    return;
  }

  const errors: unknown[] = [];

  if (discordConfigured) {
    try {
      await sendFeedbackDiscord(validated);
    } catch (error) {
      errors.push(error);
      console.error('Discord feedback delivery failed', error);
    }
  }

  if (emailConfigured) {
    try {
      await sendFeedbackEmail(validated);
    } catch (error) {
      errors.push(error);
      console.error('Email feedback delivery failed', error);
    }
  }

  if (errors.length > 0 && errors.length === Number(discordConfigured) + Number(emailConfigured)) {
    throw new Error('Feedback delivery failed');
  }
}
