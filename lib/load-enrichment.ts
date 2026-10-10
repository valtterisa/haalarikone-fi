import enrichmentData from '@/data/enriched_orgs_and_schools.json';

export type EnrichedStudentUnion = {
  name: string;
  website: string | null;
  description: string | null;
};

export type EnrichedSchool = {
  name: string;
  type: string;
  website: string | null;
  description: string | null;
  studentUnion: EnrichedStudentUnion | null;
  areas: string[];
  entryCount: number;
  orgCount: number;
};

export type EnrichedOrganization = {
  name: string;
  slug: string;
  schools: string[];
  fields: string[];
  areas: string[];
  website: string | null;
  description: string | null;
  source: string | null;
};

type EnrichmentFile = {
  schools: EnrichedSchool[];
  organizations: EnrichedOrganization[];
};

const data = enrichmentData as EnrichmentFile;

const schoolsByName = new Map(
  data.schools.map((school) => [school.name.trim().toLowerCase(), school]),
);

const organizationsBySlug = new Map(
  data.organizations.map((org) => [org.slug.trim().toLowerCase(), org]),
);

export function getEnrichedSchool(finnishName: string): EnrichedSchool | null {
  const key = finnishName.trim().toLowerCase();
  if (!key) return null;
  return schoolsByName.get(key) ?? null;
}

export function getEnrichedOrganization(slug: string): EnrichedOrganization | null {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  return organizationsBySlug.get(key) ?? null;
}
