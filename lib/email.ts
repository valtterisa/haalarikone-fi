import { SITE_ORIGIN } from '@/lib/site-url';

type EmailAddress = { email: string; name?: string };

type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailBinding = {
  send(message: {
    to: string | EmailAddress | Array<string | EmailAddress>;
    from: string | EmailAddress;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId: string }>;
};

function fromAddress(): EmailAddress {
  const raw = process.env.EMAIL_FROM ?? 'Haalarikone <no-reply@haalarikone.fi>';
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || undefined, email: match[2].trim() };
  }
  return { email: raw.trim() };
}

function isLocalDev(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.EMAIL_DEV_LOG === '1';
}

function logMagicLinkToTerminal(email: string, url: string): void {
  console.log(`
════════════════════════════════════════════════════════
[auth] Magic link for ${email}
${url}
════════════════════════════════════════════════════════
`);
}

async function getEmailBinding(): Promise<SendEmailBinding | null> {
  try {
    // @vite-ignore — only available inside Cloudflare Workers / vite-plugin workerd
    const { env } = await import(/* @vite-ignore */ 'cloudflare:workers');
    return (env as { EMAIL?: SendEmailBinding }).EMAIL ?? null;
  } catch {
    return null;
  }
}

async function sendViaRest(payload: SendEmailPayload): Promise<void> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID missing');
  }

  const from = fromAddress();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [payload.to],
        from: from.name ? { address: from.email, name: from.name } : from.email,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    },
  );

  const body = (await response.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || !body.success) {
    const detail =
      body.errors
        ?.map((e) => e.message)
        .filter(Boolean)
        .join('; ') || response.statusText;
    throw new Error(`Cloudflare Email Sending failed: ${detail}`);
  }
}

async function sendEmail(payload: SendEmailPayload, softSkipLabel: string): Promise<void> {
  if (isLocalDev()) {
    console.warn(`[email] local skip — ${softSkipLabel}`, payload.to);
    return;
  }

  const binding = await getEmailBinding();
  if (binding) {
    await binding.send({
      to: payload.to,
      from: fromAddress(),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return;
  }

  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
    await sendViaRest(payload);
    return;
  }

  throw new Error(`Cloudflare Email not configured — ${softSkipLabel}`);
}

export async function sendMagicLinkEmail(params: { email: string; url: string }): Promise<void> {
  if (isLocalDev()) {
    logMagicLinkToTerminal(params.email, params.url);
    return;
  }

  await sendEmail(
    {
      to: params.email,
      subject: 'Kirjautumislinkki — Haalarikone',
      html: `
      <div style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 0 auto; padding: 1.5rem;">
        <p style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.75rem;">Haalarikone</p>
        <p style="margin: 0 0 1rem; line-height: 1.5; color: #333;">
          Klikkaa alla olevaa linkkiä kirjautuaksesi. Linkki vanhenee pian.
        </p>
        <p style="margin: 0 0 1.5rem;">
          <a href="${params.url}" style="display: inline-block; background: #65a30d; color: #fff; text-decoration: none; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 600;">
            Kirjaudu sisään
          </a>
        </p>
        <p style="margin: 0; font-size: 0.875rem; color: #666; line-height: 1.4;">
          Jos et pyytänyt tätä viestiä, voit jättää sen huomiotta.
        </p>
      </div>
    `,
      text: `Kirjaudu Haalarikoneeseen: ${params.url}\n\nJos et pyytänyt tätä, jätä viesti huomiotta.`,
    },
    `magic link for ${params.email}`,
  );
}

export async function sendClaimApprovedEmail(params: {
  email: string;
  orgName: string;
  orgSlug: string;
}): Promise<void> {
  const editUrl = `${SITE_ORIGIN}/oma/${params.orgSlug}`;
  await sendEmail(
    {
      to: params.email,
      subject: `${params.orgName} — profiili vahvistettu | Haalarikone`,
      html: `
      <div style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 0 auto; padding: 1.5rem;">
        <p style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.75rem;">Haalarikone</p>
        <p style="margin: 0 0 1rem; line-height: 1.5; color: #333;">
          Organisaation <strong>${params.orgName}</strong> lunastus on hyväksytty.
          Voit nyt muokata virallista haalariprofiilia.
        </p>
        <p style="margin: 0 0 1.5rem;">
          <a href="${editUrl}" style="display: inline-block; background: #65a30d; color: #fff; text-decoration: none; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 600;">
            Muokkaa profiilia
          </a>
        </p>
      </div>
    `,
      text: `${params.orgName} on vahvistettu. Muokkaa: ${editUrl}`,
    },
    'claim approved',
  );
}

export async function sendClaimRejectedEmail(params: {
  email: string;
  orgName: string;
}): Promise<void> {
  await sendEmail(
    {
      to: params.email,
      subject: `${params.orgName} — lunastus hylätty | Haalarikone`,
      html: `
      <div style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 0 auto; padding: 1.5rem;">
        <p style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.75rem;">Haalarikone</p>
        <p style="margin: 0 0 1rem; line-height: 1.5; color: #333;">
          Organisaation <strong>${params.orgName}</strong> lunastuspyyntö hylättiin.
          Voit yrittää uudelleen ainejärjestön sähköpostilla tai ottaa yhteyttä palautteen kautta.
        </p>
        <p style="margin: 0;">
          <a href="${SITE_ORIGIN}" style="color: #65a30d;">haalarikone.fi</a>
        </p>
      </div>
    `,
      text: `${params.orgName} lunastus hylättiin. Katso haalarikone.fi`,
    },
    'claim rejected',
  );
}
