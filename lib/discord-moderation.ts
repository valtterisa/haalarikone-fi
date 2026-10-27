import { truncateDiscordField } from '@/lib/feedback-schema';
import { adminActionUrl, createAdminActionToken } from '@/lib/admin-action-token';

const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

export function isDiscordModerationConfigured(): boolean {
  return Boolean(webhookUrl);
}

async function postEmbed(embed: {
  title: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
}): Promise<void> {
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: embed.title,
          color: embed.color,
          fields: embed.fields,
          timestamp: new Date().toISOString(),
          footer: { text: embed.footer ?? 'Haalarikone moderaatio' },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord moderation webhook failed: ${response.status}`);
  }
}

export async function notifyClaimPending(params: {
  claimId: string;
  orgName: string;
  orgSlug: string;
  overallId: number;
  userEmail: string;
  website: string | null;
  proofMessage: string | null;
  pageUrl: string;
  verifyMethod: 'domain' | 'manual';
}): Promise<void> {
  if (params.verifyMethod === 'domain') {
    await postEmbed({
      title: 'Organisaatio lunastettu (auto)',
      color: 0x65a30d,
      fields: [
        { name: 'Organisaatio', value: truncateDiscordField(params.orgName, 256), inline: true },
        { name: 'Slug', value: truncateDiscordField(params.orgSlug, 256), inline: true },
        { name: 'Sähköposti', value: truncateDiscordField(params.userEmail, 256), inline: true },
        {
          name: 'Peruuta',
          value: `[Revoke](${adminActionUrl(createAdminActionToken({ action: 'revoke', kind: 'claim', id: params.claimId }))})`,
        },
      ],
    });
    return;
  }

  const approve = adminActionUrl(
    createAdminActionToken({ action: 'approve', kind: 'claim', id: params.claimId }),
  );
  const reject = adminActionUrl(
    createAdminActionToken({ action: 'reject', kind: 'claim', id: params.claimId }),
  );

  await postEmbed({
    title: 'Lunastuspyyntö (manuaalinen)',
    color: 0xeab308,
    fields: [
      { name: 'Organisaatio', value: truncateDiscordField(params.orgName, 256), inline: true },
      { name: 'Slug', value: truncateDiscordField(params.orgSlug, 256), inline: true },
      { name: 'Overall ID', value: String(params.overallId), inline: true },
      { name: 'Sähköposti', value: truncateDiscordField(params.userEmail, 256), inline: true },
      params.website
        ? { name: 'Verkkosivu', value: truncateDiscordField(params.website, 256), inline: true }
        : null,
      params.proofMessage
        ? { name: 'Perustelu', value: truncateDiscordField(params.proofMessage, 1000) }
        : null,
      { name: 'Sivu', value: truncateDiscordField(params.pageUrl, 1024) },
      {
        name: 'Toiminnot',
        value: `[Hyväksy](${approve}) · [Hylkää](${reject})`,
      },
    ].filter((field): field is NonNullable<typeof field> => field !== null),
  });
}
