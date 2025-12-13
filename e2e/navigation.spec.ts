import { test, expect } from "@playwright/test";

/**
 * Basic navigation and page load tests
 */
test.describe("Navigation", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Product Combo/i);
  });

  test("edit-combo page loads", async ({ page }) => {
    await page.goto("/edit-combo");
    await expect(page.getByRole("heading", { name: /Edit Combo/i })).toBeVisible();
  });

  test("crosssell page loads", async ({ page }) => {
    await page.goto("/crosssell");
    await expect(page.getByRole("heading", { name: /Crosssell/i })).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Settings|設定/i })).toBeVisible();
  });
});
