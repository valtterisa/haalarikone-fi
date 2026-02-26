import { test, expect } from "@playwright/test";

test("submits feedback from the home page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Scroll to the feedback section like a real user.
  await page.locator("#palaute").scrollIntoViewIfNeeded();

  await page.getByTestId("feedback-trigger").click();

  const messageInput = page.getByTestId("feedback-message");
  await expect(messageInput).toBeVisible();
  await messageInput.fill(
    "Tämä on testipalaute, jonka pitäisi laukaista onnistunut palautevirtaus.",
  );

  await page.getByTestId("feedback-submit").click();

  await expect(
    page.getByRole("heading", { name: "Palaute lähetetty!" }),
  ).toBeVisible();
});

