import {
  CURSOR_PR_BUTTON_CUSTOM_ID,
  signDiscordFeedbackAction,
} from '@/lib/discord-feedback-action';
import { feedbackSchema, truncateDiscordField, type FeedbackPayload } from '@/lib/feedback-schema';

const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

function hasDiscordBotCredentials(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_FEEDBACK_CHANNEL_ID);
}

export function isDiscordFeedbackConfigured(): boolean {
  return Boolean(webhookUrl) || hasDiscordBotCredentials();
}

function buildEmbed(validated: FeedbackPayload, signature: string | null) {
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

  return {
    title,
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: signature ? `Haalarikone palaute · ${signature}` : 'Haalarikone palaute',
    },
  };
}

async function postViaBot(validated: FeedbackPayload): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN!;
  const channelId = process.env.DISCORD_FEEDBACK_CHANNEL_ID!;
  const isCorrection = validated.type === 'correction';

  const truncatedMessage = truncateDiscordField(validated.message, 1000);
  const signature =
    isCorrection && process.env.CURSOR_AUTOMATION_WEBHOOK_KEY
      ? signDiscordFeedbackAction({
          type: validated.type,
          message: truncatedMessage,
          sourceId: validated.sourceId,
          sourceName: validated.sourceName,
          pageUrl: validated.pageUrl,
        })
      : null;

  const body: Record<string, unknown> = {
    allowed_mentions: { parse: [] },
    embeds: [buildEmbed(validated, signature)],
  };

  // Button only when we can verify the click later (Cursor key present).
  if (isCorrection && signature) {
    body.components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: 'Luo draft-PR',
            custom_id: CURSOR_PR_BUTTON_CUSTOM_ID,
          },
        ],
      },
    ];
  }

  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Discord bot message failed (${response.status}): ${text.slice(0, 200)}`);
  }
}

async function postViaWebhook(validated: FeedbackPayload): Promise<void> {
  if (!webhookUrl) {
    throw new Error('Discord webhook is not configured');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allowed_mentions: { parse: [] },
      embeds: [buildEmbed(validated, null)],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Discord webhook failed (${response.status}): ${text.slice(0, 200)}`);
  }
}

export async function sendFeedbackDiscord(payload: FeedbackPayload): Promise<void> {
  const result = feedbackSchema.safeParse(payload);
  if (!result.success) {
    throw new Error('Invalid feedback data');
  }

  const validated = result.data;

  // Prefer bot (supports the Luo draft-PR button). Fall back to webhook so feedback
  // still lands if the bot lacks channel access / token / permissions.
  if (hasDiscordBotCredentials()) {
    try {
      await postViaBot(validated);
      return;
    } catch (error) {
      console.error('[feedback] Discord bot post failed, trying webhook fallback:', error);
      if (!webhookUrl) {
        throw error;
      }
    }
  }

  if (!webhookUrl) {
    return;
  }

  await postViaWebhook(validated);
}
