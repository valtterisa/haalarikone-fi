'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireDb } from '@/lib/db';
import { organizationInvites, organizationProfiles } from '@/lib/db/schema';
import { requireAdminSession, requireSession } from '@/lib/auth-session';
import { approveClaim, rejectClaim, revokeClaim, submitOrganizationClaim } from '@/lib/org-claims';
import { sendClaimInviteEmail } from '@/lib/email';
import { loadUniversities } from '@/lib/load-universities';

/** Form fields: valid URL, or blank (saved as null). */
const blankableUrl = z.url().max(500).or(z.literal(''));
const blankableHex = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .or(z.literal(''));

const profileSchema = z.object({
  orgSlug: z.string().min(1),
  displayName: z.string().max(200).nullable(),
  website: blankableUrl,
  descriptionFi: z.string().max(4000).nullable(),
  descriptionEn: z.string().max(4000).nullable(),
  descriptionSv: z.string().max(4000).nullable(),
  instagramUrl: blankableUrl,
  discordUrl: blankableUrl,
  variLabel: z.string().max(100).nullable(),
  variBase: z.array(z.string()).max(8),
  hex: blankableHex,
  textColor: z.enum(['white', 'black']),
});

function formText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullIfBlank(value: string): string | null {
  return value === '' ? null : value;
}

export async function claimOrganizationAction(formData: FormData) {
  const session = await requireSession();
  const orgSlug = formText(formData.get('orgSlug'));
  if (!orgSlug) {
    return { ok: false as const, error: 'missing_slug' };
  }

  try {
    const result = await submitOrganizationClaim({
      userId: session.user.id,
      userEmail: session.user.email,
      orgSlug,
      proofMessage: nullIfBlank(formText(formData.get('proofMessage'))),
    });
    return { ok: true as const, status: result.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return { ok: false as const, error: message };
  }
}

export async function updateOrganizationProfileAction(formData: FormData) {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({
    orgSlug: formText(formData.get('orgSlug')),
    displayName: nullIfBlank(formText(formData.get('displayName'))),
    website: formText(formData.get('website')),
    descriptionFi: nullIfBlank(formText(formData.get('descriptionFi'))),
    descriptionEn: nullIfBlank(formText(formData.get('descriptionEn'))),
    descriptionSv: nullIfBlank(formText(formData.get('descriptionSv'))),
    instagramUrl: formText(formData.get('instagramUrl')),
    discordUrl: formText(formData.get('discordUrl')),
    variLabel: nullIfBlank(formText(formData.get('variLabel'))),
    variBase: formText(formData.get('variBase'))
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
    hex: formText(formData.get('hex')),
    textColor: formText(formData.get('textColor')) === 'black' ? 'black' : 'white',
  });

  if (!parsed.success) {
    return { ok: false as const, error: 'invalid' };
  }

  const { data } = parsed;
  const db = requireDb();
  const [profile] = await db
    .select()
    .from(organizationProfiles)
    .where(eq(organizationProfiles.orgSlug, data.orgSlug))
    .limit(1);

  if (!profile || profile.claimedByUserId !== session.user.id) {
    return { ok: false as const, error: 'forbidden' };
  }

  await db
    .update(organizationProfiles)
    .set({
      displayName: data.displayName,
      website: nullIfBlank(data.website),
      descriptionFi: data.descriptionFi,
      descriptionEn: data.descriptionEn,
      descriptionSv: data.descriptionSv,
      instagramUrl: nullIfBlank(data.instagramUrl),
      discordUrl: nullIfBlank(data.discordUrl),
      variLabel: data.variLabel,
      variBaseJson: data.variBase.length > 0 ? JSON.stringify(data.variBase) : null,
      hex: nullIfBlank(data.hex),
      textColor: data.textColor,
      updatedAt: new Date(),
      updatedByUserId: session.user.id,
    })
    .where(eq(organizationProfiles.orgSlug, data.orgSlug));

  return { ok: true as const };
}

export async function adminApproveClaimAction(claimId: string) {
  const session = await requireAdminSession();
  await approveClaim(claimId, session.user.email);
  return { ok: true as const };
}

export async function adminRejectClaimAction(claimId: string) {
  const session = await requireAdminSession();
  await rejectClaim(claimId, session.user.email);
  return { ok: true as const };
}

export async function adminRevokeClaimAction(claimId: string) {
  const session = await requireAdminSession();
  await revokeClaim(claimId, session.user.email);
  return { ok: true as const };
}

export async function sendClaimInviteAction(formData: FormData) {
  const session = await requireAdminSession();
  const orgSlug = formText(formData.get('orgSlug'));
  const emailResult = z.email().safeParse(formText(formData.get('email')).toLowerCase());

  if (!orgSlug || !emailResult.success) {
    return { ok: false as const, error: 'invalid' };
  }

  const email = emailResult.data;
  const universities = await loadUniversities('fi');
  const overall = universities.find((u) => u.slug === orgSlug);
  if (!overall) {
    return { ok: false as const, error: 'not_found' };
  }

  await sendClaimInviteEmail({
    email,
    orgName: overall.ainejarjesto ?? orgSlug,
    orgSlug,
  });

  const now = new Date();
  const db = requireDb();
  await db
    .insert(organizationInvites)
    .values({
      id: crypto.randomUUID(),
      orgSlug,
      email,
      sentAt: now,
      sentBy: session.user.email,
    })
    .onConflictDoUpdate({
      target: [organizationInvites.orgSlug, organizationInvites.email],
      set: {
        sentAt: now,
        sentBy: session.user.email,
      },
    });

  return { ok: true as const };
}
