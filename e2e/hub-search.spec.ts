import { test, expect } from '@playwright/test';
import { expectSettledResults, resultCount, waitForSearchResponse } from './helpers/search-ui';

test.describe('hub search UI', () => {
  test('color hub search returns results and can clear back to idle', async ({ page }) => {
    await page.goto('/fi/vari');
    await expect(page.getByTestId('text-search-input')).toBeVisible();
    await expect(page.getByTestId('results-list')).toHaveCount(0);

    const input = page.getByTestId('text-search-input');
    const searchDone = waitForSearchResponse(page, (body) => body.query === 'Helsinki');
    await input.fill('Helsinki');
    await searchDone;

    await expectSettledResults(page);
    const filteredCount = await resultCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    await expect(page.getByTestId('results-list')).toContainText(/Helsinki/i);

    await page.getByRole('button', { name: 'Tyhjennä haku' }).click();
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('results-list')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId('search-empty')).toHaveCount(0);
  });

  test('field hub search returns results for a text query', async ({ page }) => {
    await page.goto('/fi/ala');
    await expect(page.getByTestId('text-search-input')).toBeVisible();
    await expect(page.getByTestId('results-list')).toHaveCount(0);

    const input = page.getByTestId('text-search-input');
    const searchDone = waitForSearchResponse(page, (body) => body.query === 'yliopisto');
    await input.fill('yliopisto');
    await searchDone;

    await expectSettledResults(page);
    expect(await resultCount(page)).toBeGreaterThan(0);
  });
});
