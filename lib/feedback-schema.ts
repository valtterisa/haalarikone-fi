import { z } from 'zod';

export const feedbackTypes = ['general', 'correction'] as const;

export const feedbackSchema = z.object({
  type: z.enum(feedbackTypes),
  message: z.string().min(10).max(5000),
  email: z.email().nullable(),
  sourceId: z.string().max(100).nullable(),
  sourceName: z.string().max(200).nullable(),
  pageUrl: z.string().max(2000).nullable(),
  origin: z.url().nullable(),
  referer: z.string().max(500).nullable(),
  honeypot: z.literal('').or(z.undefined()).optional(),
});

export type FeedbackPayload = z.infer<typeof feedbackSchema>;
export type FeedbackType = (typeof feedbackTypes)[number];

export function truncateDiscordField(value: string, max = 1000): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}
