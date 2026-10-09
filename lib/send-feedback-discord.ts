import { feedbackSchema, truncateDiscordField, type FeedbackPayload } from '@/lib/feedback-schema';

const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

export function isDiscordFeedbackConfigured(): boolean {
  return Boolean(webhookUrl);
}

export async function sendFeedbackDiscord(payload: FeedbackPayload): Promise<void> {
  if (!webhookUrl) {
    return;
  }

  const result = feedbackSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('Invalid feedback data');
  }

  const validated = result.data;
  const isCorrection = validated.type === 'correction';
  const title = isCorrection ? 'Korjauspyyntö' : 'Yleinen palaute';
  const color = isCorrection ? 0xeab308 : 0x22c55e;

  const fields = [
    {
      name: 'Viesti',
      value: truncateDiscordField(validated.message, 1000),
    },
    validated.sourceName
      ? {
          name: 'Kohde',
          value: truncateDiscordField(validated.sourceName, 256),
          inline: true,
        }
      : null,
    validated.sourceId
      ? {
          name: 'Kohteen ID',
          value: truncateDiscordField(validated.sourceId, 256),
          inline: true,
        }
      : null,
    validated.email
      ? {
          name: 'Yhteystieto',
          value: truncateDiscordField(validated.email, 256),
          inline: true,
        }
      : null,
    validated.pageUrl
      ? {
          name: 'Sivu',
          value: truncateDiscordField(validated.pageUrl, 1024),
        }
      : null,
    validated.referer
      ? {
          name: 'Referer',
          value: truncateDiscordField(validated.referer, 1024),
        }
      : null,
  ].filter((field): field is NonNullable<typeof field> => field !== null);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title,
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: 'Haalarikone palaute' },
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Discord webhook failed (${response.status}): ${body.slice(0, 200)}`);
  }
}
