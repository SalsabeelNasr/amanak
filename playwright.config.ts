import { defineConfig } from "@playwright/test";

function pickBrowser(): "chromium" | "firefox" | "webkit" {
  const b = process.env.PLAYWRIGHT_BROWSER;
  if (b === "chromium" || b === "webkit" || b === "firefox") return b;
  /** Chromium: mobile Sheet (Base UI dialog) opens reliably in e2e; Firefox often never mounts the popup. */
  return "chromium";
}

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list" as const,
  use: {
    baseURL: "http://127.0.0.1:3000",
    /** Firefox + `pnpm exec playwright install` is reliable on Apple Silicon; override with PLAYWRIGHT_BROWSER. */
    browserName: pickBrowser(),
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm exec next dev --port 3000 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_MOCK_API: "true",
    },
  },
});
