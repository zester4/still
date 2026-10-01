import { expect, test } from "playwright/test";

const publicPages = ["/", "/about", "/terms", "/privacy", "/disclaimer", "/safety"];

test.describe("public safety and legal surfaces", () => {
  for (const path of publicPages) {
    test(`${path} renders without a horizontal overflow`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    });
  }

  test("safety page keeps human crisis resources visible", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.getByText("988 Suicide & Crisis Lifeline")).toBeVisible();
    await expect(page.getByText(/not a suicide-watch service/i)).toBeVisible();
  });
});

test.describe("account recovery and consent", () => {
  test("signup requires the legal agreement and exposes password visibility", async ({ page }) => {
    await page.goto("/signup");
    const submit = page.getByRole("button", { name: "Create this space" });
    await expect(submit).toBeDisabled();
    await expect(page.getByRole("checkbox", { name: /agree to the terms/i })).toBeVisible();

    const password = page.locator("#password");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
  });

  test("forgot password, reset, and verification routes fail safely without tokens", async ({ page }) => {
    for (const path of ["/forgot-password", "/reset-password", "/verify-email"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    }
    await page.goto("/reset-password");
    await expect(page.getByText(/choose a new password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /save new password/i })).toBeDisabled();
    await page.goto("/verify-email");
    await expect(page.getByText(/missing, expired, or already used/i)).toBeVisible();
  });
});

test.describe("responsive navigation", () => {
  test("mobile landing page does not move outside the viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});
