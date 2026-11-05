import enrichmentData from '@/data/enriched_orgs_and_schools.json';
import { getLocaleString } from '@/lib/load-blog-posts';
import type { Locale } from '@/lib/slug-translations';
import type { LocaleString } from '@/types/blog-post';

type EnrichedStudentUnion = {
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

type RawStudentUnion = {
  name: string;
  website: string | null;
  description: LocaleString | null;
};

type RawSchool = {
  name: string;
  type: string;
  website: string | null;
  description: LocaleString | null;
  studentUnion: RawStudentUnion | null;
  areas: string[];
  entryCount: number;
  orgCount: number;
};

type RawOrganization = {
  name: string;
  slug: string;
  schools: string[];
  fields: string[];
  areas: string[];
  website: string | null;
  description: LocaleString | null;
  source: string | null;
};

type EnrichmentFile = {
  schools: RawSchool[];
  organizations: RawOrganization[];
};

const data = enrichmentData as EnrichmentFile;

const schoolsByName = new Map(
  data.schools.map((school) => [school.name.trim().toLowerCase(), school]),
);

const organizationsBySlug = new Map(
  data.organizations.map((org) => [org.slug.trim().toLowerCase(), org]),
);

function resolveDescription(value: LocaleString | null, locale: Locale): string | null {
  if (value == null) return null;
  const resolved = getLocaleString(value, locale).trim();
  return resolved.length > 0 ? resolved : null;
}

function resolveStudentUnion(
  studentUnion: RawStudentUnion | null,
  locale: Locale,
): EnrichedStudentUnion | null {
  if (!studentUnion) return null;
  return {
    name: studentUnion.name,
    website: studentUnion.website,
    description: resolveDescription(studentUnion.description, locale),
  };
}

function resolveSchool(school: RawSchool, locale: Locale): EnrichedSchool {
  return {
    name: school.name,
    type: school.type,
    website: school.website,
    description: resolveDescription(school.description, locale),
    studentUnion: resolveStudentUnion(school.studentUnion, locale),
    areas: school.areas,
    entryCount: school.entryCount,
    orgCount: school.orgCount,
  };
}

function resolveOrganization(org: RawOrganization, locale: Locale): EnrichedOrganization {
  return {
    name: org.name,
    slug: org.slug,
    schools: org.schools,
    fields: org.fields,
    areas: org.areas,
    website: org.website,
    description: resolveDescription(org.description, locale),
    source: org.source,
  };
}

export function getEnrichedSchool(
  finnishName: string,
  locale: Locale = 'fi',
): EnrichedSchool | null {
  const key = finnishName.trim().toLowerCase();
  if (!key) return null;
  const school = schoolsByName.get(key);
  return school ? resolveSchool(school, locale) : null;
}

export function getEnrichedOrganization(
  slug: string,
  locale: Locale = 'fi',
): EnrichedOrganization | null {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const org = organizationsBySlug.get(key);
  return org ? resolveOrganization(org, locale) : null;
}
