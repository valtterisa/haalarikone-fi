import { beforeAll, describe, expect, it } from 'vitest';
import { GET } from './route';
import { getSlugForEntity } from '@/lib/slug-translations';
import { loadUniversities } from '@/lib/load-universities';
import { getTaxonomyEntities } from '@/lib/taxonomy-hub';

function isPng(buffer: Buffer) {
  return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

describe('GET /api/og', () => {
  let universitySlug: string;

  beforeAll(async () => {
    const universities = await loadUniversities('fi');
    const [first] = getTaxonomyEntities(universities, 'university');
    universitySlug = getSlugForEntity(first, 'fi', 'university');
  });

  it('returns a PNG for organization kind', async () => {
    const req = new Request('http://localhost/api/og?kind=organization&slug=lok-ry&locale=fi');
    const res = await GET(req);
    const buffer = Buffer.from(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(isPng(buffer)).toBe(true);
  });

  it('returns a PNG for university kind', async () => {
    const req = new Request(
      `http://localhost/api/og?kind=university&slug=${universitySlug}&locale=fi`,
    );
    const res = await GET(req);
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(res.status).toBe(200);
    expect(isPng(buffer)).toBe(true);
  });

  it('returns a cached 400 fallback for missing params', async () => {
    const req = new Request('http://localhost/api/og');
    const res = await GET(req);
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toContain('s-maxage=3600');
    expect(isPng(buffer)).toBe(true);
  });

  it('returns a cached 404 fallback for unknown organization slug', async () => {
    const req = new Request('http://localhost/api/og?kind=organization&slug=no-such-org&locale=fi');
    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toContain('s-maxage=3600');
    expect(isPng(Buffer.from(await res.arrayBuffer()))).toBe(true);
  });

  it('rejects invalid kind, locale, and oversized slugs without rendering success', async () => {
    const invalidKind = await GET(
      new Request('http://localhost/api/og?kind=nope&slug=lok-ry&locale=fi'),
    );
    const invalidLocale = await GET(
      new Request('http://localhost/api/og?kind=organization&slug=lok-ry&locale=de'),
    );
    const oversized = await GET(
      new Request(`http://localhost/api/og?kind=organization&slug=${'a'.repeat(200)}&locale=fi`),
    );

    expect(invalidKind.status).toBe(400);
    expect(invalidLocale.status).toBe(400);
    expect(oversized.status).toBe(400);
  });
});
