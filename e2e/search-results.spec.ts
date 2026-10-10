import { test, expect } from '@playwright/test';
import { expectSettledResults, resultCount, waitForSearchResponse } from './helpers/search-ui';

test.describe('search results UI', () => {
  test('clicking a result opens the overall detail page', async ({ page }) => {
    await page.goto('/fi');
    await expectSettledResults(page);

    const input = page.getByTestId('text-search-input');
    const searchDone = waitForSearchResponse(page, (body) => body.query === 'Helsinki');
    await input.fill('Helsinki');
    await searchDone;
    await expectSettledResults(page);
    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBeGreaterThan(0);

    const firstResult = page.getByTestId('results-list').locator('a[href*="/haalari/"]').first();
    const href = await firstResult.getAttribute('href');
    expect(href).toMatch(/\/haalari\//);

    await Promise.all([page.waitForURL(/\/haalari\//), firstResult.click()]);
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(/^$/);
  });

  test('nonsense query shows empty state after search settles', async ({ page }) => {
    await page.goto('/fi');
    await expectSettledResults(page);

    const nonsense = `zzzzqwerty_${Date.now()}`;
    const input = page.getByTestId('text-search-input');
    const searchDone = waitForSearchResponse(page, (body) => body.query === nonsense);
    await input.fill(nonsense);
    await searchDone;

    await expect(page.getByTestId('search-empty')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('search-empty')).toContainText(
      'Haku ei tuottanut tuloksia. Kokeile muokata hakuehtoja.',
    );
    await expect(page.getByTestId('results-list')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Haun tulokset/ })).toHaveCount(0);
  });
});
