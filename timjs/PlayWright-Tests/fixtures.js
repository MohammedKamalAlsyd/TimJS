// TimJS/PlayWright-Tests/fixtures.js
const { test: base, chromium, expect } = require('@playwright/test');
const path = require('path');

const test = base.extend({
  context: async ({}, use) => {
    // Assume the extension is located in the TimJS directory (one level up)
    const pathToExtension = path.join(__dirname, '..');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // For Manifest V3:
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');
    
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

module.exports = { test, expect };
