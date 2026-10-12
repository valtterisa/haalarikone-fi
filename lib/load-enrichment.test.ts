import { describe, expect, it } from 'vitest';
import { getEnrichedOrganization, getEnrichedSchool } from '@/lib/load-enrichment';

describe('load-enrichment locales', () => {
  it('returns localized school descriptions by locale', () => {
    const fi = getEnrichedSchool('Helsingin yliopisto', 'fi');
    const en = getEnrichedSchool('Helsingin yliopisto', 'en');
    const sv = getEnrichedSchool('Helsingin yliopisto', 'sv');

    expect(fi?.description).toMatch(/Helsingin yliopisto/);
    expect(en?.description).toMatch(/University of Helsinki/);
    expect(sv?.description).toMatch(/Helsingfors universitet/);
    expect(en?.studentUnion?.description).toMatch(/Student Union/i);
    expect(sv?.studentUnion?.description).toMatch(/Studentkåren/i);
  });

  it('returns localized organization descriptions by locale', () => {
    const fi = getEnrichedOrganization('pirate', 'fi');
    const en = getEnrichedOrganization('pirate', 'en');
    const sv = getEnrichedOrganization('pirate', 'sv');

    expect(fi?.description).toBeTruthy();
    expect(en?.description).toBeTruthy();
    expect(sv?.description).toBeTruthy();
    expect(en?.description).not.toBe(fi?.description);
    expect(sv?.description).not.toBe(fi?.description);
  });
});
