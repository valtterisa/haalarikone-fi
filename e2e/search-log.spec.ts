import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { countLogRows, hasTursoDb, waitForLogRow } from './helpers/turso';

const enabled = hasTursoDb();

type SearchRequestBody = { query?: string; source?: string };

function recordSearchRequests(page: Page) {
  const bodies: SearchRequestBody[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/search') && req.method() === 'POST') {
      bodies.push(req.postDataJSON() as SearchRequestBody);
    }
  });
  return bodies;
}

function waitForSearchResponse(page: Page, query: string) {
  return page.waitForResponse(
    (res) =>
      res.url().includes('/api/search') &&
      res.request().method() === 'POST' &&
      res.ok() &&
      (res.request().postDataJSON() as SearchRequestBody).query === query,
    { timeout: 15_000 },
  );
}

test.describe('search log via /api/search', () => {
  test.skip(!enabled, 'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');

  test('settled listing text search sends one request and inserts one Turso row', async ({
    page,
  }) => {
    const marker = `__e2e_slog_${randomUUID()}`;
    const sinceMs = Date.now() - 1000;
    const requests = recordSearchRequests(page);

    await page.goto('/fi');
    const input = page.getByTestId('text-search-input');
    await expect(input).toBeVisible();

    const searchDone = waitForSearchResponse(page, marker);
    await input.fill(marker);
    await searchDone;

    const row = await waitForLogRow({ query: marker, source: 'listing', sinceMs });
    expect(String(row.query)).toBe(marker);
    expect(String(row.source)).toBe('listing');
    expect(await countLogRows({ query: marker, source: 'listing', sinceMs })).toBe(1);

    expect(requests.filter((body) => body.query === marker)).toHaveLength(1);
  });

  test('typing after a settled prefix does not resend or duplicate the prefix', async ({
    page,
  }) => {
    const prefix = `__e2e_pre_${randomUUID().slice(0, 8)}`;
    const suffix = '_more';
    const finalQuery = `${prefix}${suffix}`;
    const sinceMs = Date.now() - 1000;
    const requests = recordSearchRequests(page);

    await page.goto('/fi');
    const input = page.getByTestId('text-search-input');
    await expect(input).toBeVisible();

    const firstSearch = waitForSearchResponse(page, prefix);
    await input.fill(prefix);
    await firstSearch;
    await waitForLogRow({ query: prefix, source: 'listing', sinceMs });

    const secondSearch = waitForSearchResponse(page, finalQuery);
    await input.pressSequentially(suffix, { delay: 120 });
    await secondSearch;
    await waitForLogRow({ query: finalQuery, source: 'listing', sinceMs });

    expect(requests.filter((body) => body.query === prefix)).toHaveLength(1);
    expect(requests.filter((body) => body.query === finalQuery)).toHaveLength(1);

    expect(await countLogRows({ query: prefix, source: 'listing', sinceMs })).toBe(1);
    expect(await countLogRows({ query: finalQuery, source: 'listing', sinceMs })).toBe(1);
  });

  test('filter-only search inserts a Turso row', async ({ request }) => {
    const sinceMs = Date.now() - 1000;
    const res = await request.post('/api/search', {
      data: {
        query: '',
        locale: 'fi',
        source: 'listing',
        color: 'punainen',
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.totalCount).toBeGreaterThan(0);

    const row = await waitForLogRow({
      query: '',
      color: 'punainen',
      source: 'listing',
      sinceMs,
    });
    expect(String(row.query)).toBe('');
    expect(String(row.color)).toBe('punainen');
    expect(Number(row.result_count)).toBe(body.totalCount);
  });
});
