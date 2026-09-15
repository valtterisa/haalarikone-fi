import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { hasTursoDb, waitForLogRow } from './helpers/turso';

const enabled = hasTursoDb();

test.describe('search log via /api/search', () => {
  test.skip(!enabled, 'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');

  test('settled listing text search inserts a Turso row', async ({ page }) => {
    const marker = `__e2e_slog_${randomUUID()}`;

    await page.goto('/fi');
    const input = page.getByTestId('text-search-input');
    await expect(input).toBeVisible();

    const searchDone = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.request().method() === 'POST' && res.ok(),
      { timeout: 15_000 },
    );
    await input.fill(marker);
    await searchDone;

    const row = await waitForLogRow({ query: marker, source: 'listing' });
    expect(String(row.query)).toBe(marker);
    expect(String(row.source)).toBe('listing');
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
