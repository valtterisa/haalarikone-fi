import { getCloudflareContext } from '@opennextjs/cloudflare';

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

function deferredEphemeral() {
  return json({
    type: 5,
    data: { flags: 64 },
  });
}

/** Keep work alive after the HTTP response. Never await the task before responding to Discord. */
function enqueueAfterResponse(task: () => Promise<unknown>): void {
  const promise = task();
  try {
    getCloudflareContext().ctx.waitUntil(promise);
  } catch {
    void promise;
  }
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
    console.error('[discord/interactions] failed to edit deferred reply:', error);
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

async function processCursorButton(interaction: DiscordInteraction): Promise<void> {
  const applicationId = interaction.application_id;
  const interactionToken = interaction.token;
  if (!applicationId || !interactionToken) {
    return;
  }

  const embed = interaction.message?.embeds?.[0];
  if (!embed) {
    await editDeferredReply(applicationId, interactionToken, 'Viestistä puuttuu palaute-embed.');
    return;
  }

  const parsed = parseFeedbackFromDiscordEmbed(embed);
  if (!parsed || !verifyDiscordFeedbackAction(parsed.payload, parsed.signature)) {
    await editDeferredReply(
      applicationId,
      interactionToken,
      'Palautteen allekirjoitus ei täsmää — painiketta ei voi käyttää.',
    );
    return;
  }

  const result = await notifyCursorAutomation(toFeedbackPayload(parsed.payload));
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

  // Discord ping — must be instant
  if (interaction.type === 1) {
    return json({ type: 1 });
  }

  // Message component (button): ACK within 3s, do Cursor work after the response.
  if (interaction.type === 3) {
    if (interaction.data?.custom_id !== CURSOR_PR_BUTTON_CUSTOM_ID) {
      return ephemeral('Tuntematon painike.');
    }
    if (!interaction.application_id || !interaction.token) {
      return ephemeral('Discord-vuorovaikutuksesta puuttuu token.');
    }

    enqueueAfterResponse(() => processCursorButton(interaction));
    return deferredEphemeral();
  }

  return ephemeral('Tätä vuorovaikutusta ei tueta.');
}
