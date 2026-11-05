import { and, eq, ne } from 'drizzle-orm';
import { requireDb } from '@/lib/db';
import { organizationClaims, organizationProfiles } from '@/lib/db/schema';
import { emailMatchesOrgWebsite } from '@/lib/org-email-domain';
import { notifyClaimPending } from '@/lib/discord-moderation';
import { sendClaimApprovedEmail, sendClaimRejectedEmail } from '@/lib/email';
import { SITE_ORIGIN } from '@/lib/site-url';
import { loadUniversities } from '@/lib/load-universities';
import { getEnrichedOrganization } from '@/lib/load-enrichment';

function newId(): string {
  return crypto.randomUUID();
}

export async function submitOrganizationClaim(params: {
  userId: string;
  userEmail: string;
  orgSlug: string;
  proofMessage?: string | null;
}): Promise<{ status: 'approved' | 'pending'; claimId: string }> {
  const db = requireDb();
  const universities = await loadUniversities('fi');
  const overall = universities.find((u) => u.slug === params.orgSlug);
  if (!overall) {
    throw new Error('ORG_NOT_FOUND');
  }

  const existingApproved = await db
    .select()
    .from(organizationClaims)
    .where(
      and(
        eq(organizationClaims.orgSlug, params.orgSlug),
        eq(organizationClaims.status, 'approved'),
      ),
    )
    .limit(1);

  if (existingApproved[0] && existingApproved[0].userId !== params.userId) {
    throw new Error('ALREADY_CLAIMED');
  }

  const enrichment = getEnrichedOrganization(params.orgSlug, 'fi');
  const website = enrichment?.website ?? null;
  const canAuto = emailMatchesOrgWebsite(params.userEmail, website);
  const claimId = newId();
  const now = new Date();

  await db.insert(organizationClaims).values({
    id: claimId,
    userId: params.userId,
    orgSlug: params.orgSlug,
    overallId: overall.id,
    status: canAuto ? 'approved' : 'pending',
    proofMessage: params.proofMessage?.trim() || null,
    claimEmail: params.userEmail,
    verifyMethod: canAuto ? 'domain' : 'manual',
    reviewedAt: canAuto ? now : null,
    reviewedBy: canAuto ? 'domain' : null,
    createdAt: now,
  });

  if (canAuto) {
    await upsertProfileFromClaim({
      orgSlug: params.orgSlug,
      overallId: overall.id,
      userId: params.userId,
      enrichmentWebsite: website,
      enrichmentName: overall.ainejarjesto,
      enrichmentDescription: enrichment?.description ?? null,
    });

    await sendClaimApprovedEmail({
      email: params.userEmail,
      orgName: overall.ainejarjesto ?? params.orgSlug,
      orgSlug: params.orgSlug,
    }).catch((err) => console.error('[claim] approved email failed', err));
  }

  await notifyClaimPending({
    claimId,
    orgName: overall.ainejarjesto ?? params.orgSlug,
    orgSlug: params.orgSlug,
    overallId: overall.id,
    userEmail: params.userEmail,
    website,
    proofMessage: params.proofMessage ?? null,
    pageUrl: `${SITE_ORIGIN}/haalari/${params.orgSlug}`,
    verifyMethod: canAuto ? 'domain' : 'manual',
  }).catch((err) => console.error('[claim] discord notify failed', err));

  return { status: canAuto ? 'approved' : 'pending', claimId };
}

async function upsertProfileFromClaim(params: {
  orgSlug: string;
  overallId: number;
  userId: string;
  enrichmentWebsite: string | null;
  enrichmentName: string | null;
  enrichmentDescription: string | null;
}) {
  const db = requireDb();
  const now = new Date();
  const existing = await db
    .select()
    .from(organizationProfiles)
    .where(eq(organizationProfiles.orgSlug, params.orgSlug))
    .limit(1);

  if (existing[0]) {
    await db
      .update(organizationProfiles)
      .set({
        claimedByUserId: params.userId,
        updatedByUserId: params.userId,
        updatedAt: now,
        verifiedAt: now,
      })
      .where(eq(organizationProfiles.orgSlug, params.orgSlug));
    return;
  }

  await db.insert(organizationProfiles).values({
    orgSlug: params.orgSlug,
    overallId: params.overallId,
    displayName: params.enrichmentName,
    website: params.enrichmentWebsite,
    descriptionFi: params.enrichmentDescription,
    descriptionEn: null,
    descriptionSv: null,
    instagramUrl: null,
    discordUrl: null,
    variLabel: null,
    variBaseJson: null,
    hex: null,
    textColor: null,
    claimedByUserId: params.userId,
    verifiedAt: now,
    updatedAt: now,
    updatedByUserId: params.userId,
  });
}

export async function approveClaim(claimId: string, reviewedBy: string): Promise<void> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(organizationClaims)
    .where(eq(organizationClaims.id, claimId))
    .limit(1);
  const claim = rows[0];
  if (!claim) throw new Error('CLAIM_NOT_FOUND');
  if (claim.status === 'approved') return;

  const other = await db
    .select()
    .from(organizationClaims)
    .where(
      and(
        eq(organizationClaims.orgSlug, claim.orgSlug),
        eq(organizationClaims.status, 'approved'),
        ne(organizationClaims.id, claimId),
      ),
    )
    .limit(1);
  if (other[0]) throw new Error('ALREADY_CLAIMED');

  const now = new Date();
  await db
    .update(organizationClaims)
    .set({ status: 'approved', reviewedAt: now, reviewedBy })
    .where(eq(organizationClaims.id, claimId));

  const universities = await loadUniversities('fi');
  const overall = universities.find((u) => u.slug === claim.orgSlug);
  const enrichment = getEnrichedOrganization(claim.orgSlug, 'fi');

  await upsertProfileFromClaim({
    orgSlug: claim.orgSlug,
    overallId: claim.overallId,
    userId: claim.userId,
    enrichmentWebsite: enrichment?.website ?? null,
    enrichmentName: overall?.ainejarjesto ?? null,
    enrichmentDescription: enrichment?.description ?? null,
  });

  await sendClaimApprovedEmail({
    email: claim.claimEmail,
    orgName: overall?.ainejarjesto ?? claim.orgSlug,
    orgSlug: claim.orgSlug,
  });
}

export async function rejectClaim(claimId: string, reviewedBy: string): Promise<void> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(organizationClaims)
    .where(eq(organizationClaims.id, claimId))
    .limit(1);
  const claim = rows[0];
  if (!claim) throw new Error('CLAIM_NOT_FOUND');
  if (claim.status === 'rejected') return;

  const now = new Date();
  await db
    .update(organizationClaims)
    .set({ status: 'rejected', reviewedAt: now, reviewedBy })
    .where(eq(organizationClaims.id, claimId));

  const universities = await loadUniversities('fi');
  const overall = universities.find((u) => u.slug === claim.orgSlug);

  await sendClaimRejectedEmail({
    email: claim.claimEmail,
    orgName: overall?.ainejarjesto ?? claim.orgSlug,
  });
}

export async function revokeClaim(claimId: string, reviewedBy: string): Promise<void> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(organizationClaims)
    .where(eq(organizationClaims.id, claimId))
    .limit(1);
  const claim = rows[0];
  if (!claim) throw new Error('CLAIM_NOT_FOUND');

  const now = new Date();
  await db
    .update(organizationClaims)
    .set({ status: 'rejected', reviewedAt: now, reviewedBy: `revoke:${reviewedBy}` })
    .where(eq(organizationClaims.id, claimId));

  await db.delete(organizationProfiles).where(eq(organizationProfiles.orgSlug, claim.orgSlug));
}
