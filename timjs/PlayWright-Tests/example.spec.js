// TimJS/PlayWright-Tests/example.spec.js
const { test, expect } = require('./fixtures');

/**
 * Helper function to retrieve the background worker/page.
 * For Manifest V3, we use serviceWorkers; adjust if needed for Manifest V2.
 */
async function getBackgroundPage(context) {
  let bg = context.serviceWorkers()[0];
  if (!bg) bg = await context.waitForEvent('serviceworker');
  return bg;
}

test.describe('Background Script Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Attempt to clear localStorage if accessible.
    try {
      await page.evaluate(() => localStorage.clear());
    } catch (err) {
      console.warn('localStorage.clear() failed, skipping:', err);
    }
    
    // Clear chrome.storage.local via the background page.
    const backgroundPage = await getBackgroundPage(context);
    await backgroundPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'clearStorage' }, (response) => {
          resolve(response && response.status);
        });
      });
    });
  });

  // Test 1: Verify that time spent on a regular website is recorded accurately.
  test('records time spent on a website', async ({ page, context }) => {
    await page.goto('https://example.com');
    const trackingStart = Date.now();
    await page.waitForTimeout(10000); // Simulate a 10-second session.
    const trackingEnd = Date.now();
    // Navigate away to trigger saving of session data.
    await page.goto('https://google.com');
    await page.waitForTimeout(1000); // Allow background save time.

    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    console.log('ttt',trackingData)
    const today = new Date().toISOString().split('T')[0];
    const domain = 'example.com';
    const recordedTime = trackingData.sessions[today][domain].time; // Recorded in minutes.
    const expectedTime = (trackingEnd - trackingStart) / 60000;
    // Allow a maximum error of 5 seconds (~0.0833 minutes).
    expect(Math.abs(recordedTime - expectedTime)).toBeLessThanOrEqual(0.0833);
  });

  // Test 2: Verify that transitioning from one website to another is tracked correctly.
  test('records next website transition correctly', async ({ page, context }) => {
    // Visit website A.
    await page.goto('https://example.com');
    await page.waitForTimeout(5000); // Simulate a 5-second session on example.com.
    // Switch to website B.
    await page.goto('https://google.com');
    await page.waitForTimeout(1000); // Allow data to be saved.

    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    // Verify that example.com has a nextWebsites entry for google.com incremented by 1.
    const nextWebsites = trackingData.sessions[today]['example.com'].nextWebsites;
    expect(nextWebsites['google.com']).toBe(1);
  });

  // Test 3: Verify YouTube video session time for a 5-minute session.
  test('records YouTube video time for a 5 minute session', async ({ page, context }) => {
    // Intercept the proxy fetch for YouTube to return dummy HTML with genre "Educational".
    await page.route('https://api.codetabs.com/v1/proxy*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><head><meta itemprop="genre" content="Educational"></head><body></body></html>',
      });
    });

    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    const backgroundPage = await getBackgroundPage(context);
    // Adjust session start time to simulate a 5-minute session.
    await backgroundPage.evaluate(() => {
      const now = new Date();
      for (const windowId in activeTabs) {
        if (activeTabs.hasOwnProperty(windowId)) {
          activeTabs[windowId].sessionStart = new Date(now.getTime() - 5 * 60 * 1000);
        }
      }
    });
    // Navigate away to trigger saving of the session.
    await page.goto('https://example.com');
    await page.waitForTimeout(1000); // Allow data to be saved.

    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    console.log(interactionData)
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    const recordedVideoTime = genres['Educational'] ? genres['Educational'].video || 0 : 0;
    const expectedTime = 5; // Expected 5 minutes.
    expect(Math.abs(recordedVideoTime - expectedTime)).toBeLessThanOrEqual(0.0833);
  });

  // Test 4: Verify YouTube shorts session time for a 5-minute session.
  test('records YouTube shorts time for a 5 minute session', async ({ page, context }) => {
    // Intercept the proxy fetch for YouTube to return dummy HTML with genre "Gaming".
    await page.route('https://api.codetabs.com/v1/proxy*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><head><meta itemprop="genre" content="Gaming"></head><body></body></html>',
      });
    });

    const shortsUrl = 'https://www.youtube.com/shorts/8J9Z_G8r8YQ';
    await page.goto(shortsUrl);
    const backgroundPage = await getBackgroundPage(context);
    // Adjust session start time to simulate a 5-minute session.
    await backgroundPage.evaluate(() => {
      const now = new Date();
      for (const windowId in activeTabs) {
        if (activeTabs.hasOwnProperty(windowId)) {
          activeTabs[windowId].sessionStart = new Date(now.getTime() - 5 * 60 * 1000);
        }
      }
    });
    // Navigate away to trigger saving of the session.
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);

    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    const recordedShortsTime = genres['Gaming'] ? genres['Gaming'].shorts || 0 : 0;
    const expectedTime = 5; // Expected 5 minutes.
    expect(Math.abs(recordedShortsTime - expectedTime)).toBeLessThanOrEqual(0.0833);
  });
});
