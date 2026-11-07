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
    const res = await GET(req as never);
    const buffer = Buffer.from(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
    expect(isPng(buffer)).toBe(true);
  });

  it('returns a PNG for university kind', async () => {
    const req = new Request(
      `http://localhost/api/og?kind=university&slug=${universitySlug}&locale=fi`,
    );
    const res = await GET(req as never);
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(isPng(buffer)).toBe(true);
  });

  it('returns a fallback image for missing params', async () => {
    const req = new Request('http://localhost/api/og');
    const res = await GET(req as never);
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(res.status).toBe(200);
    expect(isPng(buffer)).toBe(true);
  });

  it('returns a fallback image for unknown organization slug', async () => {
    const req = new Request('http://localhost/api/og?kind=organization&slug=no-such-org&locale=fi');
    const res = await GET(req as never);
    expect(isPng(Buffer.from(await res.arrayBuffer()))).toBe(true);
  });
});
