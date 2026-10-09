import { Resend } from 'resend';
import { feedbackSchema, type FeedbackPayload } from '@/lib/feedback-schema';

const resendApiKey = process.env.RESEND_API_KEY;
const feedbackTo = process.env.FEEDBACK_EMAIL_TO;
const feedbackFrom = 'noreply@haalarikone.fi';

export function isFeedbackEmailConfigured(): boolean {
  return Boolean(resendApiKey && feedbackTo);
}

export async function sendFeedbackEmail(payload: FeedbackPayload): Promise<void> {
  if (!resendApiKey || !feedbackTo) {
    return;
  }

  const result = feedbackSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('Invalid feedback data');
  }

  const validated = result.data;
  const subject =
    validated.type === 'correction' ? 'Haalarikone - korjauspyyntö' : 'Haalarikone - uusi palaute';

  const metaLines = [
    ['Tyyppi', validated.type],
    ['Kohde', validated.sourceName],
    ['Kohteen ID', validated.sourceId],
    ['Yhteystieto', validated.email],
    ['Sivu', validated.pageUrl],
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
