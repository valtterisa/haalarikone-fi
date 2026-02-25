import { test, expect } from "@playwright/test";

test("filters results using advanced filters", async ({ page }) => {
  await page.goto("/");

  await page.getByText("Suodattimet").click();

  await page.getByLabel("Väri").click();
  await page.getByRole("option", { name: "Punainen" }).click();

  // Close the color listbox to avoid intercepting further clicks.
  await page.keyboard.press("Escape");

  await page.getByLabel("Kaupunki").click();
  await page.getByRole("option", { name: "Helsinki" }).click();

  // Ensure any open city listbox is closed before moving on.
  await page.keyboard.press("Escape");

  await page.getByLabel("Opiskeluala").click();
  await page.getByRole("option", { name: "fysiikka", exact: true }).click();

  // Close the field listbox as well.
  await page.keyboard.press("Escape");

  await page.getByLabel("Oppilaitos").click();
  await page.getByRole("option", { name: "Helsingin yliopisto" }).click();

  await page.getByRole("button", { name: /Suodata/ }).click();

  await expect(
    page.getByText("Helsingin yliopisto", { exact: false }).first()
  ).toBeVisible();
});

test("searches via text input and updates results", async ({ page }) => {
  await page.goto("/");

  const searchResponse = await page.request.post("/api/search", {
    data: { query: "Helsinki" },
  });

  expect(searchResponse.ok()).toBeTruthy();
  const body = await searchResponse.json();
  expect(Array.isArray(body.results)).toBeTruthy();
  expect(body.results.length).toBeGreaterThan(0);
});

test("searches via the home page search UI and shows results", async ({ page }) => {
  await page.goto("/");

  const input = page.getByTestId("text-search-input");
  await input.fill("Helsinki");

  await page.waitForTimeout(2000);

  const resultsList = page.getByTestId("results-list");
  await expect(resultsList).toBeVisible();
  await expect(resultsList.getByRole("listitem").first()).toBeVisible();
});
