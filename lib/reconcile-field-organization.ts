import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';
import { getUniqueFields } from './get-unique-values';

const SEP_PREFIX = /^[\s\-(/–—]/;

function fieldMatchesOrganizationName(fieldLower: string, orgLower: string): boolean {
  if (orgLower === fieldLower) return true;
  if (fieldLower.length < 2) return false;
  const rest = orgLower.slice(fieldLower.length);
  if (orgLower.startsWith(fieldLower) && rest.length > 0 && SEP_PREFIX.test(rest)) {
    return true;
  }
  return false;
}

export function findCanonicalOrgForMisclassifiedField(
  field: string,
  orgNames: string[],
): string | null {
  const fl = field.trim().toLowerCase();
  if (!fl) return null;

  for (const org of orgNames) {
    const ol = org.toLowerCase();
    if (fieldMatchesOrganizationName(fl, ol)) {
      return org;
    }
  }
  return null;
}

export function reconcileFieldOrganizationFilters(
  qu: QueryUnderstanding,
  universities: University[],
): QueryUnderstanding {
  const rawField = qu.filters.field?.trim();
  if (!rawField || qu.isGibberish) {
    return qu;
  }

  const seen = new Set<string>();
  const orgNames: string[] = [];
  for (const u of universities) {
    const n = u.ainejarjesto?.trim();
    if (n && !seen.has(n)) {
      seen.add(n);
      orgNames.push(n);
    }
  }
  if (orgNames.length === 0) {
    return qu;
  }

  const knownFields = new Set(
    getUniqueFields(universities)
      .map((f) => f.trim().toLowerCase())
      .filter(Boolean),
  );
  const fieldLower = rawField.toLowerCase();
  if (knownFields.has(fieldLower)) {
    return qu;
  }

  const matchedOrg = findCanonicalOrgForMisclassifiedField(rawField, orgNames);
  if (!matchedOrg) {
    return qu;
  }

  const existingOrg = qu.filters.organization?.trim();

  return {
    ...qu,
    filters: {
      ...qu.filters,
      field: undefined,
      organization: existingOrg || matchedOrg,
    },
  };
}
