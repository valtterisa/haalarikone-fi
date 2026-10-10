import { test, expect, type Page } from '@playwright/test';

const QUERY = 'Helsinki';
const PREFIX = 'Hel';

function recordSearchQueries(page: Page) {
  const queries: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/search') && req.method() === 'POST') {
      queries.push(String((req.postDataJSON() as { query?: string }).query ?? ''));
    }
  });
  return queries;
}

function resultCount(page: Page) {
  return page
    .getByRole('heading', { name: /Haun tulokset/ })
    .locator('span')
    .innerText()
    .then((text) => Number.parseInt(text, 10));
}

async function expectSettledResults(page: Page) {
  await expect(page.getByTestId('results-list')).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId('results-list').locator('a[href*="/haalari/"]').first(),
  ).toBeVisible();
}

test.describe('listing search UI', () => {
  test('pausing mid-word then finishing narrows results with one request per settled query', async ({
    page,
  }) => {
    const queries = recordSearchQueries(page);
    await page.goto('/fi');
    await expectSettledResults(page);
    const allCount = await resultCount(page);
    expect(allCount).toBeGreaterThan(0);

    const input = page.getByTestId('text-search-input');
    const prefixDone = page.waitForResponse(
      (res) =>
        res.url().includes('/api/search') &&
        res.ok() &&
        (res.request().postDataJSON() as { query?: string }).query === PREFIX,
      { timeout: 15_000 },
    );
    await input.pressSequentially(PREFIX, { delay: 80 });
    await prefixDone;

    const queryDone = page.waitForResponse(
      (res) =>
        res.url().includes('/api/search') &&
        res.ok() &&
        (res.request().postDataJSON() as { query?: string }).query === QUERY,
      { timeout: 15_000 },
    );
    await input.pressSequentially(QUERY.slice(PREFIX.length), { delay: 150 });
    await queryDone;

    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBeLessThan(allCount);
    await expectSettledResults(page);
    expect(await resultCount(page)).toBeGreaterThan(0);
    await expect(page.getByTestId('results-list')).toContainText(QUERY);
    expect(queries.filter((query) => query === PREFIX)).toHaveLength(1);
    expect(queries.filter((query) => query === QUERY)).toHaveLength(1);
  });

  test('clearing the query restores the full default list', async ({ page }) => {
    await page.goto('/fi');
    await expectSettledResults(page);
    const allCount = await resultCount(page);

    const input = page.getByTestId('text-search-input');
    await input.fill(QUERY);
    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBeLessThan(allCount);

    await page.getByRole('button', { name: 'Tyhjennä haku' }).click();
    await expect(input).toHaveValue('');
    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBe(allCount);
  });

  test('typing past a settled query and back does not leave the search stuck', async ({ page }) => {
    await page.goto('/fi');
    await expectSettledResults(page);
    const allCount = await resultCount(page);

    const input = page.getByTestId('text-search-input');
    const searchDone = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.ok(),
      { timeout: 15_000 },
    );
    await input.fill(QUERY);
    await input.press('x');
    await input.press('Backspace');
    await searchDone;

    await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBeLessThan(allCount);
    await expectSettledResults(page);
    await expect(input).toHaveValue(QUERY);
  });

  test('?search= in the URL runs the search on load', async ({ page }) => {
    const queries = recordSearchQueries(page);
    await page.goto(`/fi?search=${QUERY}`);

    await expect(page.getByTestId('text-search-input')).toHaveValue(QUERY);
    await expectSettledResults(page);
    await expect(page.getByTestId('results-list')).toContainText(QUERY);
    await expect.poll(() => queries.filter((query) => query === QUERY).length).toBe(1);
  });
});
