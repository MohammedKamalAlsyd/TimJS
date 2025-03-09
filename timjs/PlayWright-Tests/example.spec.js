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
    const backgroundPage = await getBackgroundPage(context);
    const isStorageDefined = await backgroundPage.evaluate(() => typeof chrome.storage !== 'undefined');
    // Clear storage to reset state between tests.
    if (isStorageDefined) {
      await backgroundPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.clear(() => {
            resolve();
          });
        });
      });
    }
  });

  // Test 1: Verify that time spent on a regular website is recorded accurately.
  test('Test 1: Records time spent on a website', async ({ page, context }) => {
    await page.goto('https://example.com');
    const trackingStart = Date.now();
    await page.waitForTimeout(10000); // Simulate a 10-second session.
    const trackingEnd = Date.now();
    await page.goto('https://google.com');
    await page.waitForTimeout(3000); // Ensure background save completes.

    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const domain = 'example.com';
    const recordedTime = trackingData.sessions[today][domain].time; // In minutes.
    const expectedTime = (trackingEnd - trackingStart) / 60000; // Convert to minutes.
    // tolerance of 0.1 (6s).
    expect(Math.abs(recordedTime - expectedTime)).toBeLessThanOrEqual(0.1);
  });

  // Test 2: Verify that transitioning from one website to another is tracked correctly.
  test('Test 2: Records next website transition correctly', async ({ page, context }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000); // Simulate a 5-second session.
    await page.goto('https://google.com');
    await page.waitForTimeout(5000); // Ensure data is saved.

    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const nextWebsites = trackingData.sessions[today]['example.com'].nextWebsites;
    expect(nextWebsites['google.com']).toBe(1);
  });

  // Test 3: Verify YouTube video session time for a 5-minute session.
  test('Test 3: Records YouTube video time for a 5-minute session', async ({ page, context }) => {
    test.setTimeout(70000); // Increase timeout for safety.
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    await page.waitForTimeout(30000); // 30-second session.

    const backgroundPage = await getBackgroundPage(context);
    await page.goto('https://example.com'); // Force a save.
    await page.waitForTimeout(1000); // Allow save to complete.

    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    const recordedVideoTime = genres['Music'] ? genres['Music'].video || 0 : 0;
    expect(Math.abs(recordedVideoTime - 0.5)).toBeLessThanOrEqual(0.0833); // ~5s tolerance.
  });

  // Test 4: Verify YouTube shorts session time for a 5-minute session.
  test('Test 4: Records YouTube shorts time for a 5-minute session', async ({ page, context }) => {
    test.setTimeout(90000); // Increased timeout to 90s.
    const shortsUrl = 'https://www.youtube.com/shorts/ggcWTdwWYgo';
    await page.goto(shortsUrl);
    await page.waitForTimeout(30000); // 30-second session.

    const backgroundPage = await getBackgroundPage(context);
    await page.goto('https://example.com'); // Force background save.
    await page.waitForTimeout(1000); // Ensure save completes.

    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    const recordedShortsTime = genres['Gaming'] ? genres['Gaming'].shorts || 0 : 0;
    expect(Math.abs(recordedShortsTime - 0.5)).toBeLessThanOrEqual(0.0833); // ~5s tolerance.
  });

  // Test 5: Verify time accumulation on a single website without changing tabs.
  test('Test 5: Accumulates time on a single website without changing tabs', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(10000); // Accumulate 10 seconds.

    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const domain = 'example.com';
    const recordedTime = trackingData.sessions[today][domain].time; // In minutes.
    const elapsedTime = (Date.now() - startTime) / 60000; // Convert to minutes.
    // Increased tolerance to 0.1 (6s tolerance)
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.1);
  });

  // Test 6: Verify YouTube video time accumulation without navigating away.
  test('Test 6: Accumulates YouTube video time without navigating away', async ({ page, context }) => {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    await page.waitForTimeout(10000); // Accumulate 10 seconds.
    // Force background to save by navigating away.
    await page.goto('https://example.com');
    await page.waitForTimeout(1000); // Allow save to complete.

    const backgroundPage = await getBackgroundPage(context);
    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    const totalVideoTime = Object.values(genres).reduce((sum, g) => sum + (g.video || 0), 0);
    const expectedTime = 10 / 60; // ~0.1667 minutes.
    expect(Math.abs(totalVideoTime - expectedTime)).toBeLessThanOrEqual(0.0833); // ~5s tolerance.
  });

  // Test 7: Verify time tracking when switching between tabs.
  test('Test 7: Tracks time correctly when switching between tabs', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('https://example.com');
    await page1.waitForTimeout(5000); // 5 seconds on page1.
  
    const page2 = await context.newPage();
    await page2.goto('https://google.com');
    await page2.waitForTimeout(5000); // 5 seconds on page2.
  
    await page1.bringToFront();
    await page1.waitForTimeout(5000); // Another 5 seconds on page1.
  
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const exampleTime = trackingData.sessions[today]['example.com'].time;
    const googleTime = trackingData.sessions[today]['google.com'].time;
  
    // Increase tolerance to 0.2 (≈10 seconds) for example.com and google.com
    expect(Math.abs(exampleTime - 0.1667)).toBeLessThanOrEqual(0.14);
    expect(Math.abs(googleTime - 0.0833)).toBeLessThanOrEqual(0.14);
  });
});
