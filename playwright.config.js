// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Minimal Playwright-Konfiguration für lokale Visual-Tests.
 * Nicht für CI optimiert – dient als Grundlage für Batch 3C.
 *
 * WebServer dient test_output/html/ auf localhost:3000.
 * Tests greifen auf <circuit>_overlay.html zu.
 */
module.exports = defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npx http-server test_output/html -p 3000 --silent',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
