import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { approveClaim, rejectClaim, revokeClaim, submitOrganizationClaim } from '@/lib/org-claims';
import { getOrganizationProfile } from '@/lib/org-profile';
import { organizationClaims, organizationProfiles, user } from '@/lib/db/schema';
import { ensureDb, hasTursoDb } from '@/lib/test/turso-search-log';

vi.mock('@/lib/discord-moderation', () => ({
  notifyClaimPending: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email', () => ({
  sendClaimApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendClaimRejectedEmail: vi.fn().mockResolvedValue(undefined),
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

describe.skipIf(!hasTursoDb)('organization claims → Turso', () => {
  const createdUserIds: string[] = [];
  const touchedSlugs = new Set<string>();

  async function seedUser(email: string) {
    const db = ensureDb();
    const id = `vitest_${randomUUID()}`;
    const now = new Date();
    await db.insert(user).values({
      id,
      name: email.split('@')[0] ?? 'vitest',
      email,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    });
    createdUserIds.push(id);
    return id;
  }

  beforeEach(() => {
    ensureDb();
  });

  afterEach(async () => {
    const db = ensureDb();
    for (const slug of touchedSlugs) {
      await db.delete(organizationProfiles).where(eq(organizationProfiles.orgSlug, slug));
      await db.delete(organizationClaims).where(eq(organizationClaims.orgSlug, slug));
    }
    touchedSlugs.clear();
    for (const id of createdUserIds.splice(0)) {
      await db.delete(organizationClaims).where(eq(organizationClaims.userId, id));
      await db.delete(user).where(eq(user.id, id));
    }
  });

  it('auto-approves when email domain matches org website', async () => {
    const slug = 'lok-ry';
    touchedSlugs.add(slug);
    const userId = await seedUser(`hallitus+${randomUUID().slice(0, 8)}@lok.fi`);

    const result = await submitOrganizationClaim({
      userId,
      userEmail: `hallitus@lok.fi`,
      orgSlug: slug,
    });

    expect(result.status).toBe('approved');
    const profile = await getOrganizationProfile(slug);
    expect(profile?.claimedByUserId).toBe(userId);
    expect(profile?.website).toBe('https://lok.fi');
  });

  it('keeps manual claims pending until approve/reject', async () => {
    const slug = 'lok-ry';
    touchedSlugs.add(slug);
    const email = `claimer_${randomUUID().slice(0, 8)}@gmail.com`;
    const userId = await seedUser(email);

    const pending = await submitOrganizationClaim({
      userId,
      userEmail: email,
      orgSlug: slug,
      proofMessage: 'Olen hallituksen jäsen',
    });
    expect(pending.status).toBe('pending');
    expect(await getOrganizationProfile(slug)).toBeNull();

    await approveClaim(pending.claimId, 'vitest');
    expect((await getOrganizationProfile(slug))?.claimedByUserId).toBe(userId);

    await revokeClaim(pending.claimId, 'vitest');
    expect(await getOrganizationProfile(slug)).toBeNull();
  });

  it('rejects pending claims without creating a profile', async () => {
    const slug = 'pirate';
    touchedSlugs.add(slug);
    const email = `claimer_${randomUUID().slice(0, 8)}@gmail.com`;
    const userId = await seedUser(email);

    const pending = await submitOrganizationClaim({
      userId,
      userEmail: email,
      orgSlug: slug,
    });
    expect(pending.status).toBe('pending');

    await rejectClaim(pending.claimId, 'vitest');
    expect(await getOrganizationProfile(slug)).toBeNull();

    const db = ensureDb();
    const [row] = await db
      .select()
      .from(organizationClaims)
      .where(eq(organizationClaims.id, pending.claimId))
      .limit(1);
    expect(row?.status).toBe('rejected');
  });
});
