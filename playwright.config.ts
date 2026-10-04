import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against a real Chromium. The app's File System Access layer
// runs against the origin's private file system, driven through the real UI:
// each test seeds a vault folder and opens it with the folder rail's add
// control (see tests/e2e/helpers/vault.ts). Happy paths only, grouped one suite
// per openspec capability.
const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Pin the zone so a test's "today" and the app's agree.
    timezoneId: 'UTC',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A dedicated port for the run. Playwright starts and stops this server
    // itself, so no dev server outlives the run.
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
