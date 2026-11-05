import { and, eq } from 'drizzle-orm';
import { getDb, requireDb } from '@/lib/db';
import { organizationClaims, organizationProfiles } from '@/lib/db/schema';
import type { EnrichedOrganization } from '@/lib/load-enrichment';
import type { Locale } from '@/lib/slug-translations';
import type { University } from '@/types/university';

export type OrganizationProfileRow = typeof organizationProfiles.$inferSelect;
export type OrganizationClaimRow = typeof organizationClaims.$inferSelect;

export async function getOrganizationProfile(
  orgSlug: string,
): Promise<OrganizationProfileRow | null> {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(organizationProfiles)
    .where(eq(organizationProfiles.orgSlug, orgSlug))
    .limit(1);

  return rows[0] ?? null;
}

export async function getApprovedClaimForOrg(
  orgSlug: string,
): Promise<OrganizationClaimRow | null> {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(organizationClaims)
    .where(and(eq(organizationClaims.orgSlug, orgSlug), eq(organizationClaims.status, 'approved')))
    .limit(1);

  return rows[0] ?? null;
}

export async function listProfilesByUser(userId: string): Promise<OrganizationProfileRow[]> {
  const db = requireDb();
  return db
    .select()
    .from(organizationProfiles)
    .where(eq(organizationProfiles.claimedByUserId, userId));
}

export async function listClaimsByUser(userId: string): Promise<OrganizationClaimRow[]> {
  const db = requireDb();
  return db.select().from(organizationClaims).where(eq(organizationClaims.userId, userId));
}

export async function getAllOrganizationProfiles(): Promise<OrganizationProfileRow[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(organizationProfiles);
}

export function profileDescription(
  profile: OrganizationProfileRow | null,
  locale: Locale,
): string | null {
  if (!profile) return null;
  if (locale === 'en')
    return profile.descriptionEn ?? profile.descriptionFi ?? profile.descriptionSv;
  if (locale === 'sv')
    return profile.descriptionSv ?? profile.descriptionFi ?? profile.descriptionEn;
  return profile.descriptionFi ?? profile.descriptionEn ?? profile.descriptionSv;
}

export function mergeOverallForPublic(
  overall: University,
  enrichment: EnrichedOrganization | null,
  profile: OrganizationProfileRow | null,
  locale: Locale,
): {
  overall: University;
  enrichment: EnrichedOrganization | null;
  verified: boolean;
} {
  if (!profile) {
    return { overall, enrichment, verified: false };
  }

  let variBase = overall.variBase;
  if (profile.variBaseJson) {
    try {
      const parsed = JSON.parse(profile.variBaseJson) as unknown;
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
        variBase = parsed;
      }
    } catch {
      /* keep original */
    }
  }

  const hex =
    profile.hex && profile.textColor
      ? `background: ${profile.hex}; color: ${profile.textColor};`
      : profile.hex
        ? `background: ${profile.hex}; color: white;`
        : overall.hex;

  const mergedOverall: University = {
    ...overall,
    ainejarjesto: profile.displayName ?? overall.ainejarjesto,
    vari: profile.variLabel ?? overall.vari,
    variLabel: profile.variLabel ?? overall.variLabel,
    variBase,
    hex,
  };

  const description = profileDescription(profile, locale);
  const mergedEnrichment: EnrichedOrganization | null = enrichment
    ? {
        ...enrichment,
        name: profile.displayName ?? enrichment.name,
        website: profile.website ?? enrichment.website,
        description: description ?? enrichment.description,
      }
    : {
        name: profile.displayName ?? overall.ainejarjesto ?? overall.slug,
        slug: overall.slug,
        schools: [overall.oppilaitos],
        fields: overall.ala ? [overall.ala] : [],
        areas: overall.alue ? [overall.alue] : [],
        website: profile.website,
        description,
        source: 'claimed',
      };

  return { overall: mergedOverall, enrichment: mergedEnrichment, verified: true };
}

export function buildHexStyle(hex: string, textColor: string): string {
  return `background: ${hex}; color: ${textColor};`;
}
