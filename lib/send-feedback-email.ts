'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const feedbackSchema = z.object({
  type: z.literal('general'),
  message: z.string().min(10).max(5000),
  email: z.email().nullable(),
  sourceId: z.string().max(100).nullable(),
  sourceName: z.string().max(200).nullable(),
  origin: z.url().nullable(),
  referer: z.string().max(500).nullable(),
  honeypot: z.literal('').or(z.undefined()).optional(),
});

type FeedbackEmailPayload = z.infer<typeof feedbackSchema>;

const resendApiKey = process.env.RESEND_API_KEY;
const feedbackTo = process.env.FEEDBACK_EMAIL_TO;
const feedbackFrom = 'noreply@haalarikone.fi';

export async function sendFeedbackEmail(payload: FeedbackEmailPayload) {
  if (!resendApiKey || !feedbackTo) {
    console.log(
      'Resend API key or feedback email not configured. Feedback submission will be silently skipped.',
    );
    return;
  }

  const result = feedbackSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('Invalid feedback data');
  }

  const validated = result.data;
  const subject = 'Haalarikone - uusi palaute';

  const metaLines = [
    ['Tyyppi', validated.type],
    ['Kohde', validated.sourceName],
    ['Kohteen ID', validated.sourceId],
    ['Yhteystieto', validated.email],
    ['Origin', validated.origin],
    ['Referer', validated.referer],
  ].filter(([, value]) => value);

  const htmlMeta = metaLines
    .map(([label, value]) => `<li><strong>${label}:</strong> ${String(value)}</li>`)
    .join('');

  const html = `
    <p>Uusi palaute Haalarikoneesta.</p>
    <ul>${htmlMeta}</ul>
    <p><strong>Viesti:</strong></p>
    <pre style="padding:12px;background:#f7f7f7;border-radius:8px;">${validated.message}</pre>
  `;

  const textLines = [
    `Uusi palaute (${validated.type})`,
    ...metaLines.map(([label, value]) => `${label}: ${String(value)}`),
    '',
    'Viesti:',
    validated.message,
  ].join('\n');

  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: feedbackFrom,
    to: feedbackTo,
    subject,
    text: textLines,
    html,
  });

  if (error) {
    throw error;
  }
}
