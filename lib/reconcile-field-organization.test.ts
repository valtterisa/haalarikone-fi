import { describe, it, expect } from 'vitest';
import type { University } from '@/types/university';
import type { QueryUnderstanding } from './query-understanding';
import {
  findCanonicalOrgForMisclassifiedField,
  reconcileFieldOrganizationFilters,
} from './reconcile-field-organization';

const uni = (overrides: Partial<University> & Pick<University, 'id'>): University => ({
  id: overrides.id,
  vari: 'Punainen',
  variLabel: 'Punainen',
  variBase: ['punainen'],
  hex: '#f00',
  alue: 'Helsinki',
  ala: overrides.ala ?? null,
  ainejarjesto: overrides.ainejarjesto ?? null,
  slug: overrides.slug ?? `u-${overrides.id}`,
  oppilaitos: 'X',
});

describe('findCanonicalOrgForMisclassifiedField', () => {
  it('matches exact org name case-insensitively', () => {
    expect(findCanonicalOrgForMisclassifiedField('skripti', ['Skripti'])).toBe('Skripti');
  });

  it('matches when org name continues after a separator', () => {
    expect(findCanonicalOrgForMisclassifiedField('skripti', ['Skripti ry'])).toBe('Skripti ry');
  });

  it('does not treat discipline prefix inside a longer token as org match', () => {
    expect(findCanonicalOrgForMisclassifiedField('insinööri', ['Insinöörikilta'])).toBe(null);
  });
});

describe('reconcileFieldOrganizationFilters', () => {
  const baseQu = (filters: QueryUnderstanding['filters']): QueryUnderstanding => ({
    isGibberish: false,
    filters,
    semanticQuery: '',
  });

  it('moves field to organization when field matches a known ainejärjestö', () => {
    const list = [uni({ id: 1, ainejarjesto: 'Skripti', ala: 'tietotekniikka' })];
    const qu = baseQu({
      color: undefined,
      area: undefined,
      field: 'skripti',
      school: undefined,
      organization: undefined,
    });
    const out = reconcileFieldOrganizationFilters(qu, list);
    expect(out.filters.field).toBeUndefined();
    expect(out.filters.organization).toBe('Skripti');
  });

  it('does not move when the same string is a known study field (ala)', () => {
    const list = [uni({ id: 1, ala: 'fysiikka', ainejarjesto: 'Fyysikkokilta' })];
    const qu = baseQu({
      color: undefined,
      area: undefined,
      field: 'fysiikka',
      school: undefined,
      organization: undefined,
    });
    const out = reconcileFieldOrganizationFilters(qu, list);
    expect(out.filters.field).toBe('fysiikka');
    expect(out.filters.organization).toBeUndefined();
  });

  it('keeps existing organization and only clears misclassified field', () => {
    const list = [uni({ id: 1, ainejarjesto: 'Skripti' })];
    const qu = baseQu({
      color: undefined,
      area: undefined,
      field: 'skripti',
      school: undefined,
      organization: 'Muu',
    });
    const out = reconcileFieldOrganizationFilters(qu, list);
    expect(out.filters.field).toBeUndefined();
    expect(out.filters.organization).toBe('Muu');
  });
});
