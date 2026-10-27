import { Resend } from 'resend';
import { SITE_ORIGIN } from '@/lib/site-url';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

function fromAddress() {
  return process.env.EMAIL_FROM ?? 'Haalarikone <noreply@haalarikone.fi>';
}

export async function sendMagicLinkEmail(params: { email: string; url: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing — magic link for', params.email, params.url);
    return;
  }

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
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
  });

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }
}

export async function sendClaimApprovedEmail(params: {
  email: string;
  orgName: string;
  orgSlug: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] claim approved (no Resend)', params);
    return;
  }

  const editUrl = `${SITE_ORIGIN}/oma/${params.orgSlug}`;
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
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
  });

  if (error) {
    throw new Error(`Failed to send claim approved email: ${error.message}`);
  }
}

export async function sendClaimRejectedEmail(params: {
  email: string;
  orgName: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] claim rejected (no Resend)', params);
    return;
  }

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
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
  });

  if (error) {
    throw new Error(`Failed to send claim rejected email: ${error.message}`);
  }
}

export async function sendClaimInviteEmail(params: {
  email: string;
  orgName: string;
  orgSlug: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] claim invite (no Resend)', params);
    return;
  }

  const claimUrl = `${SITE_ORIGIN}/kirjaudu?next=${encodeURIComponent(`/haalari/${params.orgSlug}?claim=1`)}`;
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.email,
    subject: `Lunasta ${params.orgName} Haalarikoneessa`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 0 auto; padding: 1.5rem;">
        <p style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.75rem;">Haalarikone</p>
        <p style="margin: 0 0 1rem; line-height: 1.5; color: #333;">
          Suomen kattavin haalariväritietokanta kutsuu ainejärjestöjä lunastamaan
          virallisen profiilin. Kirjaudu <strong>ainejärjestön sähköpostilla</strong>
          ja vahvista <strong>${params.orgName}</strong>.
        </p>
        <p style="margin: 0 0 1.5rem;">
          <a href="${claimUrl}" style="display: inline-block; background: #65a30d; color: #fff; text-decoration: none; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 600;">
            Lunasta profiili
          </a>
        </p>
        <p style="margin: 0; font-size: 0.875rem; color: #666; line-height: 1.4;">
          Jos viesti ei kuulu teille, voitte jättää sen huomiotta.
        </p>
      </div>
    `,
    text: `Lunasta ${params.orgName} Haalarikoneessa: ${claimUrl}`,
  });

  if (error) {
    throw new Error(`Failed to send claim invite: ${error.message}`);
  }
}
