import { expect, type Page, type Response } from '@playwright/test';

export function resultCount(page: Page) {
  return page
    .getByRole('heading', { name: /Haun tulokset/ })
    .locator('span')
    .innerText()
    .then((text) => Number.parseInt(text, 10));
}

export async function expectSettledResults(page: Page) {
  await expect(page.getByTestId('results-list')).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId('results-list').locator('a[href*="/haalari/"]').first(),
  ).toBeVisible();
}

export function waitForSearchResponse(
  page: Page,
  match: (body: Record<string, unknown>) => boolean,
) {
  return page.waitForResponse(
    (res: Response) => {
      if (!res.url().includes('/api/search') || res.request().method() !== 'POST' || !res.ok()) {
        return false;
      }
      try {
        return match(res.request().postDataJSON() as Record<string, unknown>);
      } catch {
        return false;
      }
    },
    { timeout: 15_000 },
  );
}

export async function openDesktopFilters(page: Page) {
  const toggle = page.locator('#search-filters-desktop-toggle');
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(page.locator('#search-filters-desktop-content')).toBeVisible();
}

export async function applyDesktopFilters(page: Page) {
  const apply = page
    .locator('#search-filters-desktop-content')
    .getByRole('button', { name: /^Suodata/ });
  await expect(apply).toBeVisible();
  await apply.click();
}

export async function clearDesktopFilters(page: Page) {
  const panelClear = page
    .locator('#search-filters-desktop-content')
    .getByRole('button', { name: 'Tyhjennä' });
  if (await panelClear.isVisible().catch(() => false)) {
    await panelClear.click();
    return;
  }

  await page.getByRole('button', { name: 'Tyhjennä', exact: true }).first().click();
}
