import {
  CURSOR_PR_BUTTON_CUSTOM_ID,
  parseFeedbackFromDiscordEmbed,
  toFeedbackPayload,
  verifyDiscordFeedbackAction,
} from '@/lib/discord-feedback-action';
import { verifyDiscordInteractionSignature } from '@/lib/discord-verify-interaction';
import { notifyCursorAutomation } from '@/lib/notify-cursor-automation';

export const runtime = 'nodejs';

type DiscordInteraction = {
  type: number;
  id?: string;
  token?: string;
  data?: { custom_id?: string };
  message?: {
    id?: string;
    channel_id?: string;
    embeds?: Array<{
      title?: string;
      footer?: { text?: string };
      fields?: Array<{ name: string; value: string }>;
    }>;
  };
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ephemeral(content: string) {
  return json({
    type: 4,
    data: {
      content,
      flags: 64,
    },
  });
}

async function disableCursorButton(messageId: string, channelId: string): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    body: JSON.stringify({ components: [] }),
  }).catch(() => undefined);
}

export async function POST(request: Request): Promise<Response> {
  const publicKey = process.env.DISCORD_APPLICATION_PUBLIC_KEY;
  if (!publicKey) {
    return json({ error: 'Discord interactions not configured' }, 503);
  }

  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const rawBody = await request.text();

  if (!signature || !timestamp) {
    return json({ error: 'Missing signature' }, 401);
  }

  const valid = verifyDiscordInteractionSignature({
    publicKeyHex: publicKey,
    signatureHex: signature,
    timestamp,
    rawBody,
  });
  if (!valid) {
    return json({ error: 'Invalid signature' }, 401);
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Discord ping
  if (interaction.type === 1) {
    return json({ type: 1 });
  }

  // Message component (button)
  if (interaction.type === 3) {
    if (interaction.data?.custom_id !== CURSOR_PR_BUTTON_CUSTOM_ID) {
      return ephemeral('Tuntematon painike.');
    }

    const embed = interaction.message?.embeds?.[0];
    if (!embed) {
      return ephemeral('Viestistä puuttuu palaute-embed.');
    }

    const parsed = parseFeedbackFromDiscordEmbed(embed);
    if (!parsed || !verifyDiscordFeedbackAction(parsed.payload, parsed.signature)) {
      return ephemeral('Palautteen allekirjoitus ei täsmää — painiketta ei voi käyttää.');
    }

    if (parsed.payload.type !== 'correction') {
      return ephemeral('Vain korjauspyynnöille voi avata Cursor-PR:n.');
    }

    const result = await notifyCursorAutomation(toFeedbackPayload(parsed.payload));
    if (result.skipped) {
      return ephemeral(`Cursor-automaatiota ei käynnistetty (${result.reason}).`);
    }
    if (!result.ok) {
      console.error('[discord/interactions]', result.error);
      return ephemeral('Cursor-webhook epäonnistui. Tarkista Automations-asetukset.');
    }

    if (interaction.message?.id && interaction.message.channel_id) {
      void disableCursorButton(interaction.message.id, interaction.message.channel_id);
    }

    return ephemeral('Cursor-agentti käynnistetty. Draft-PR aukeaa pian jos palaute on selkeä.');
  }

  return ephemeral('Tätä vuorovaikutusta ei tueta.');
}
