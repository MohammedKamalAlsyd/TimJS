const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const extensionPath = path.resolve(__dirname); // Points to TimJS directory

module.exports = defineConfig({
  testDir: './PlayWright-Tests',
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
          ],
          channel: 'chromium',
        },
      },
    },
  ],
});
