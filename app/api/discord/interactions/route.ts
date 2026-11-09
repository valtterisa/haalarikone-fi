import { after } from 'next/server';

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
  token?: string;
  application_id?: string;
  data?: { custom_id?: string };
  channel_id?: string;
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
  return json({ type: 4, data: { content, flags: 64 } });
}

async function editDeferredReply(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<void> {
  await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  ).catch((error) => {
    console.error('[discord/interactions] editDeferredReply failed:', error);
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

/** Only clicks inside the configured feedback channel; channel permissions decide who can see it. */
function isAuthorizedClick(interaction: DiscordInteraction): boolean {
  const channelId = process.env.DISCORD_FEEDBACK_CHANNEL_ID;
  return Boolean(channelId && interaction.channel_id === channelId);
}

async function processCursorButton(interaction: DiscordInteraction): Promise<void> {
  const applicationId = interaction.application_id;
  const interactionToken = interaction.token;
  if (!applicationId || !interactionToken) return;

  const embed = interaction.message?.embeds?.[0];
  const parsed = embed ? parseFeedbackFromDiscordEmbed(embed) : null;
  if (!parsed || !verifyDiscordFeedbackAction(parsed.payload, parsed.signature)) {
    await editDeferredReply(
      applicationId,
      interactionToken,
      'Palautteen allekirjoitus ei täsmää — painiketta ei voi käyttää.',
    );
    return;
  }

  const result = await notifyCursorAutomation(toFeedbackPayload(parsed.payload));
  console.log('[discord/interactions] cursor automation result:', JSON.stringify(result));
  if (!result.ok) {
    console.error('[discord/interactions]', result.error);
    await editDeferredReply(
      applicationId,
      interactionToken,
      'Cursor-webhook epäonnistui. Tarkista Automations-asetukset.',
    );
    return;
  }
  if (result.skipped) {
    await editDeferredReply(
      applicationId,
      interactionToken,
      `Cursor-automaatiota ei käynnistetty (${result.reason}).`,
    );
    return;
  }

  if (interaction.message?.id && interaction.message.channel_id) {
    await disableCursorButton(interaction.message.id, interaction.message.channel_id);
  }

  await editDeferredReply(
    applicationId,
    interactionToken,
    'Cursor-agentti käynnistetty. Draft-PR aukeaa pian jos palaute on selkeä.',
  );
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

  if (interaction.type === 1) {
    return json({ type: 1 });
  }

  if (interaction.type === 3) {
    if (interaction.data?.custom_id !== CURSOR_PR_BUTTON_CUSTOM_ID) {
      return ephemeral('Tuntematon painike.');
    }
    if (!interaction.application_id || !interaction.token) {
      return ephemeral('Discord-vuorovaikutuksesta puuttuu token.');
    }
    if (!isAuthorizedClick(interaction)) {
      return ephemeral('Sinulla ei ole oikeutta käynnistää Cursor-automaatiota.');
    }

    // Return Discord ACK now. Cursor webhook runs only after the response via next/after.
    after(() => processCursorButton(interaction));
    return json({ type: 5, data: { flags: 64 } });
  }

  return ephemeral('Tätä vuorovaikutusta ei tueta.');
}
