import { test, expect } from "@playwright/test";

test("Arabic mobile: landing → drawer → inquiry mock submit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await page.getByTestId("nav-menu-trigger").click();
  const sheet = page.locator('[data-slot="sheet-content"]');
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: "طلب استشارة" }).click();
  await expect(page).toHaveURL(/\/ar\/inquiry/);

  await page.getByLabel("الاسم الكامل").fill("مختبر أوطماتيكي");
  await page.getByLabel(/رقم الهاتف/).fill("0712345678");
  await page.getByLabel("رسالتك").fill("نص رسالة تجريبي يتجاوز عشرة أحرف.");
  await page.getByTestId("inquiry-submit").click();

  await expect(page.getByText("تم استلام طلبك بنجاح.")).toBeVisible();
});

test("English desktop: locale switch en → ar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/en");
  await page.getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/ar(\/|$)/);
});
