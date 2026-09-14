import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { hasTursoDb, waitForLogRow } from './helpers/turso';

const enabled = hasTursoDb();

test.describe('search log listing (browser)', () => {
  test.skip(!enabled, 'TURSO_DATABASE_URL not set');

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], totalCount: 0 }),
      });
    });
  });

  test('blur flushes staged listing query to Turso', async ({ page }) => {
    const marker = `__e2e_slog_${randomUUID()}_blur`;

    await page.goto('/fi');
    const input = page.getByTestId('text-search-input');
    await expect(input).toBeVisible();

    const searchDone = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await input.fill(marker);
    await searchDone;

    const postPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/log-search') &&
        res.request().method() === 'POST' &&
        res.ok(),
      { timeout: 15_000 },
    );
    await input.blur();
    await postPromise;

    const row = await waitForLogRow(marker);
    expect(String(row.query)).toBe(marker);
    expect(String(row.source)).toBe('listing');
  });

  test('pagehide flushes staged listing query to Turso', async ({ page }) => {
    const marker = `__e2e_slog_${randomUUID()}_leave`;

    await page.goto('/fi');
    const input = page.getByTestId('text-search-input');
    await expect(input).toBeVisible();

    const searchDone = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await input.fill(marker);
    await searchDone;
    await page.waitForTimeout(100);

    const postPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/log-search') &&
        res.request().method() === 'POST' &&
        res.ok(),
      { timeout: 15_000 },
    );
    await page.evaluate(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    await postPromise;

    const row = await waitForLogRow(marker);
    expect(String(row.query)).toBe(marker);
    expect(String(row.source)).toBe('listing');
  });
});
