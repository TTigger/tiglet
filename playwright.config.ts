import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 本機多個 Chromium 平行實例會耗盡資源（renderer 崩潰連鎖），保守上限 2
  workers: process.env.CI ? undefined : 2,
  // CI 需要 html reporter 才有 playwright-report/ 可以在失敗時上傳
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // CI builds in a separate step for clearer failures; locally one command does both.
    command: process.env.CI ? 'npm run preview' : 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
