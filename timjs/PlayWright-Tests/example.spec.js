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

test.describe('Comprehensive Background Script Tests', () => {
  // Before each test, clear storage and reset state.
  test.beforeEach(async ({ page, context }) => {
    const backgroundPage = await getBackgroundPage(context);
    const isStorageDefined = await backgroundPage.evaluate(() => typeof chrome.storage !== 'undefined');
    if (isStorageDefined) {
      await backgroundPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.clear(() => {
            resolve();
          });
        });
      });
      // Reset YoutubeContentScrapping to true by default.
      await backgroundPage.evaluate(() => {
        chrome.storage.sync.set({ YoutubeContentScrapping: true });
      });
    }
  });

  // Test 1: Verify that time spent on a regular website is recorded accurately (idle, no navigation).
  test('Test 1: Records time spent on a website (idle accumulation)', async ({ page, context }) => {
    const trackingStart = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(10000); // Wait 10 seconds on the same page.
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const domain = 'example.com';
    const recordedTime = trackingData.sessions[today][domain].time; // in minutes.
    const expectedTime = (Date.now() - trackingStart) / 60000;
    expect(Math.abs(recordedTime - expectedTime)).toBeLessThanOrEqual(0.0833);
  });

  // Test 2: Verify that transitioning from one website to another is tracked correctly.
  test('Test 2: Records next website transition correctly', async ({ page, context }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000); // 5-second session on example.com.
    // Transition to another site to trigger save.
    await page.goto('https://google.com');
    await page.waitForTimeout(5000); // Allow transition to be recorded.
    
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const nextWebsites = trackingData.sessions[today]['example.com'].nextWebsites;
    expect(nextWebsites['google.com']).toBe(1);
  });

  // Test 3: Verify YouTube video session time for a 30-second session.
  test('Test 3: Records YouTube video time for a 30-second session', async ({ page, context }) => {
    test.setTimeout(70000);
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    await page.waitForTimeout(30000); // 30-second session.
    // Without triggering a navigation, we let periodicUpdateAndSave update the data.
    const backgroundPage = await getBackgroundPage(context);
    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    // 30 sec = 0.5 minutes.
    const recordedVideoTime = Object.values(genres).reduce((sum, g) => sum + (g.video || 0), 0);
    expect(Math.abs(recordedVideoTime - 0.5)).toBeLessThanOrEqual(0.0833);
  });

  // Test 4: Verify YouTube shorts session time for a 30-second session.
  test('Test 4: Records YouTube shorts time for a 30-second session', async ({ page, context }) => {
    test.setTimeout(90000);
    const shortsUrl = 'https://www.youtube.com/shorts/ggcWTdwWYgo';
    await page.goto(shortsUrl);
    await page.waitForTimeout(30000); // 30-second session.
    const backgroundPage = await getBackgroundPage(context);
    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    // 30 sec = 0.5 minutes.
    const recordedShortsTime = Object.values(genres).reduce((sum, g) => sum + (g.shorts || 0), 0);
    expect(Math.abs(recordedShortsTime - 0.5)).toBeLessThanOrEqual(0.0833);
  });

  // Test 5: Verify time accumulation on a single website without navigation.
  test('Test 5: Accumulates time on a single website without navigation', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(10000); // 10-second idle period.
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const recordedTime = trackingData.sessions[today]['example.com'].time; // in minutes.
    const elapsedTime = (Date.now() - startTime) / 60000;
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.0833);
  });

  // Test 6: Verify YouTube video time accumulation without navigating away.
  test('Test 6: Accumulates YouTube video time without navigation', async ({ page, context }) => {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    await page.waitForTimeout(10000); // 10-second idle period.
    const backgroundPage = await getBackgroundPage(context);
    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    const totalVideoTime = Object.values(genres).reduce((sum, g) => sum + (g.video || 0), 0);
    const expectedTime = 10 / 60; // ~0.1667 minutes.
    expect(Math.abs(totalVideoTime - expectedTime)).toBeLessThanOrEqual(0.0833);
  });

  // Test 7: Verify time tracking when switching between tabs.
  test('Test 7: Tracks time correctly when switching between tabs', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('https://example.com');
    await page1.waitForTimeout(5000); // 5 sec on page1.
  
    const page2 = await context.newPage();
    await page2.goto('https://google.com');
    await page2.waitForTimeout(5000); // 5 sec on page2.
  
    await page1.bringToFront();
    await page1.waitForTimeout(5000); // Additional 5 sec on page1.
  
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const exampleTime = trackingData.sessions[today]['example.com'].time;
    const googleTime = trackingData.sessions[today]['google.com'].time;
    expect(Math.abs(exampleTime - (10/60))).toBeLessThanOrEqual(0.0833);
    expect(Math.abs(googleTime - (5/60))).toBeLessThanOrEqual(0.0833);
  });

  // Test 8: Verify that the icon is retrieved for a website.
  test('Test 8: Retrieves a valid favicon icon for a domain', async ({ page, context }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
    // Let periodic update run without forcing a navigation.
    await page.waitForTimeout(3000);
    
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const iconUrl = trackingData.sessions[today]['example.com'].icon;
    expect(iconUrl).toBeDefined();
    expect(iconUrl).toMatch(/^https?:\/\//);
  });

  // Test 9: Verify that when YouTube Content Scrapping is off, no YouTube data is recorded.
  test('Test 9: Does not record YouTube data when scrapping is disabled', async ({ page, context }) => {
    const backgroundPage = await getBackgroundPage(context);
    await backgroundPage.evaluate(() => {
      chrome.storage.sync.set({ YoutubeContentScrapping: false });
    });
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(15000); // 15-second session.
    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];
    const youtubeData = interactionData.youtube[today];
    if (youtubeData) {
      const totalVideoTime = Object.values(youtubeData.genres).reduce((sum, g) => sum + (g.video || 0), 0);
      expect(totalVideoTime).toBe(0);
    } else {
      expect(youtubeData).toBeUndefined();
    }
  });

  // Test 10: Comprehensive user transition simulation.
  test('Test 10: Comprehensive user transition simulation', async ({ page, context }) => {
    // Start on website A.
    await page.goto('https://example.com');
    await page.waitForTimeout(5000); // 5 sec on website A.
    // Transition to website B.
    await page.goto('https://google.com');
    await page.waitForTimeout(5000); // 5 sec on website B.
    // Transition to a YouTube video.
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(15000); // 15 sec on YouTube.
    // Disable YouTube scrapping.
    const bgPage = await getBackgroundPage(context);
    await bgPage.evaluate(() => {
      chrome.storage.sync.set({ YoutubeContentScrapping: false });
    });
    // Visit another YouTube video; this session should not record YouTube data.
    await page.goto('https://www.youtube.com/watch?v=abcdefg');
    await page.waitForTimeout(15000);
    // Transition back to website A.
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
    
    const backgroundPageFinal = await getBackgroundPage(context);
    const trackingData = await backgroundPageFinal.evaluate(() => trackingData);
    const interactionData = await backgroundPageFinal.evaluate(() => interactionData);
    const today = new Date().toISOString().split('T')[0];

    // Verify website A (example.com) time: expected ≈ 5 sec + 5 sec = 10 sec.
    const exampleTime = trackingData.sessions[today]['example.com'].time;
    expect(Math.abs(exampleTime - (10/60))).toBeLessThanOrEqual(0.0833);
    // Verify website B (google.com) time: expected ≈ 5 sec.
    const googleTime = trackingData.sessions[today]['google.com'].time;
    expect(Math.abs(googleTime - (5/60))).toBeLessThanOrEqual(0.0833);
    // Validate YouTube data: only the first YouTube session (15 sec) should be recorded.
    if (interactionData.youtube[today]) {
      const totalVideoTime = Object.values(interactionData.youtube[today].genres).reduce((sum, g) => sum + (g.video || 0), 0);
      expect(Math.abs(totalVideoTime - (15/60))).toBeLessThanOrEqual(0.0833);
    }
  });

  // Test 11: Verify that when no transition occurs and idle period is less than 40 seconds,
  // the recorded data reflects exactly the elapsed time (i.e. no extra save is triggered).
  test('Test 11: No extra idle save when idle period is < 40 seconds', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(30000); // 30-second idle period.
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const recordedTime = trackingData.sessions[today]['example.com'].time; // in minutes.
    const elapsedTime = (Date.now() - startTime) / 60000;
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.0833);
  });

  // Test 12: Verify that after 60 seconds of idle, the save triggers and recorded time is accurate.
  test('Test 12: Idle save triggered after 60 seconds of idle', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(60000); // 60-second idle period.
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = new Date().toISOString().split('T')[0];
    const recordedTime = trackingData.sessions[today]['example.com'].time; // in minutes.
    const elapsedTime = (Date.now() - startTime) / 60000;
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.0833);
  });
});
