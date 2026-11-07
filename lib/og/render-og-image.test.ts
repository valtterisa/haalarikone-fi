import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildOrganizationOgPayload, findOrganizationBySlug } from '@/lib/og/build-organization-og';
import { buildUniversityOgPayload } from '@/lib/og/build-university-og';
import { renderOgImage } from '@/lib/og/render-og-image';
import { loadUniversities } from '@/lib/load-universities';
import { getSlugForEntity } from '@/lib/slug-translations';
import { resolveTaxonomyHub } from '@/lib/taxonomy-hub';
import type { University } from '@/types/university';

const ARTIFACT_DIR = '/opt/cursor/artifacts';

function isPng(buffer: Buffer) {
  return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

describe('renderOgImage', () => {
  let universities: University[];

  beforeAll(async () => {
    universities = await loadUniversities('fi');
    mkdirSync(ARTIFACT_DIR, { recursive: true });
  });

  it('renders a PNG for an organization and writes an example artifact', async () => {
    const overall = findOrganizationBySlug(universities, 'lok-ry');
    expect(overall).toBeTruthy();
    const payload = buildOrganizationOgPayload(overall!, 'fi');
    const response = await renderOgImage(payload);
    const buffer = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(isPng(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(8_000);

    writeFileSync(join(ARTIFACT_DIR, 'og-example-organization-lok-ry.png'), buffer);
  });

  it('renders a PNG for a university and writes an example artifact', async () => {
    const slug = getSlugForEntity('Hämeen AMK', 'fi', 'university');
    const hub = resolveTaxonomyHub(universities, slug, 'fi', 'university');
    expect(hub).toBeTruthy();

    const payload = buildUniversityOgPayload(hub!.localized, hub!.rows, 'fi');
    const response = await renderOgImage(payload);
    const buffer = Buffer.from(await response.arrayBuffer());

    expect(isPng(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(8_000);

    writeFileSync(join(ARTIFACT_DIR, 'og-example-university-hameen-amk.png'), buffer);
  });

  it('renders a second organization example for visual comparison', async () => {
    const overall = findOrganizationBySlug(universities, 'laureamko');
    expect(overall).toBeTruthy();
    const payload = buildOrganizationOgPayload(overall!, 'fi');
    const response = await renderOgImage(payload);
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(isPng(buffer)).toBe(true);
    writeFileSync(join(ARTIFACT_DIR, 'og-example-organization-laureamko.png'), buffer);
  });
});
