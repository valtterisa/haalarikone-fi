import { test, expect } from '@playwright/test';
import {
  applyDesktopFilters,
  clearDesktopFilters,
  expectSettledResults,
  openDesktopFilters,
  resultCount,
  waitForSearchResponse,
} from './helpers/search-ui';

test.describe('advanced filters UI', () => {
  test('color + area filters narrow results and clear restores the full list', async ({ page }) => {
    await page.goto('/fi');
    await expectSettledResults(page);
    const allCount = await resultCount(page);
    expect(allCount).toBeGreaterThan(0);

    await openDesktopFilters(page);
    const panel = page.locator('#search-filters-desktop-content');
    await panel.getByRole('button', { name: 'Punainen' }).click();
    await panel.getByRole('tab', { name: 'Kaupunki' }).click();
    await panel.getByRole('option', { name: 'Helsinki' }).click();

    const filteredSearch = waitForSearchResponse(
      page,
      (body) => body.color === 'punainen' && body.area === 'Helsinki',
    );
    await applyDesktopFilters(page);
    await filteredSearch;

    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBeLessThan(allCount);
    await expectSettledResults(page);
    const filteredCount = await resultCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    await expect(page.getByTestId('results-list')).toContainText(/Helsinki/i);
    await expect(page.locator('#search-filters-desktop-toggle')).toContainText('Suodattimet (2)');

    await page.locator('#search-filters-desktop-toggle').click();
    await expect(page.locator('#search-filters-desktop-content')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tyhjennä: Punainen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tyhjennä: Helsinki' })).toBeVisible();

    await clearDesktopFilters(page);
    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBe(allCount);
    await expect(page.locator('#search-filters-desktop-toggle')).toHaveText('Suodattimet');
    await expect(page.getByRole('button', { name: 'Tyhjennä: Punainen' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tyhjennä: Helsinki' })).toHaveCount(0);
  });
});
