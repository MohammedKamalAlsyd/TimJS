// TimJS/PlayWright-Tests/example.spec.js
const { test, expect } = require('./fixtures');

// Helper function to get the local date string
function getCurrentDate() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

// Get the background page (service worker)
async function getBackgroundPage(context) {
  let bg = context.serviceWorkers()[0];
  if (!bg) bg = await context.waitForEvent('serviceworker');
  return bg;
}

// Wait for YouTube data to be available with retries (increased retries to 10)
async function waitForYouTubeData(backgroundPage, today, retries = 10, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    // Retrieve the interaction data stored in the background.
    const storedInteractionData = await backgroundPage.evaluate(() => interactionData);
    // Extract YouTube data for the specified date.
    const youtubeDataForToday = storedInteractionData &&
                                storedInteractionData.youtube &&
                                storedInteractionData.youtube[today];
    if (youtubeDataForToday !== undefined) {
      return youtubeDataForToday;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`YouTube interaction data not available for ${today} after ${retries} retries`);
}

test.describe('Comprehensive Background Script Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    const backgroundPage = await getBackgroundPage(context);
    // Clear storage and initialize YoutubeContentScrapping flag.
    const isStorageDefined = await backgroundPage.evaluate(() => typeof chrome.storage !== 'undefined');
    if (isStorageDefined) {
      await backgroundPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.clear(() => resolve());
        });
      });
      await backgroundPage.evaluate(() => {
        chrome.storage.sync.set({ YoutubeContentScrapping: true });
      });
    }
  });

  test('Test 1: Records time spent on a website (idle accumulation)', async ({ page, context }) => {
    const trackingStart = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(61000);
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const domain = 'example.com';
    const recordedTime = trackingData.sessions[today][domain].time;
    const expectedTime = (Date.now() - trackingStart) / 60000;
    expect(Math.abs(recordedTime - expectedTime)).toBeLessThanOrEqual(0.1);
  });

  test('Test 2: Records next website transition correctly', async ({ page, context }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
    await page.goto('https://google.com');
    await page.waitForTimeout(5000);
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const nextWebsites = trackingData.sessions[today]['example.com'].nextWebsites;
    expect(nextWebsites['google.com']).toBe(1);
  });

  test('Test 3: Records YouTube video time for a 60-second session', async ({ page, context }) => {
    test.setTimeout(80000);
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    await page.waitForTimeout(60000);
    const bgPage = await getBackgroundPage(context);
    const today = getCurrentDate();
    const youtubeData = await waitForYouTubeData(bgPage, today);
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    const expectedTime = 1;
    const recordedVideoTime = Object.values(genres).reduce((sum, g) => sum + (g.video || 0), 0);
    expect(recordedVideoTime).toBeGreaterThan(0);
    expect(Math.abs(recordedVideoTime - expectedTime)).toBeLessThanOrEqual(0.1);
    // Verify that no shorts time is recorded.
    const recordedShortsTime = Object.values(genres).reduce((sum, g) => sum + (g.shorts || 0), 0);
    expect(recordedShortsTime).toBe(0);
  });

  test('Test 4: Records YouTube shorts time for a 60-second session', async ({ page, context }) => {
    test.setTimeout(100000);
    const backgroundPage = await getBackgroundPage(context);
    await backgroundPage.evaluate(() => {
      if (!chrome.tabs) chrome.tabs = {};
      chrome.tabs.sendMessage = (tabId, message, callback) => {
        if (message.type === 'get_youtube_genre') {
          callback({ genre: 'music' });
        }
      };
    });
    const shortsUrl = 'https://www.youtube.com/shorts/ggcWTdwWYgo';
    await page.goto(shortsUrl);
    await page.waitForTimeout(60000);
    const bgPage = await getBackgroundPage(context);
    const today = getCurrentDate();
    const youtubeData = await waitForYouTubeData(bgPage, today);
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    expect(Object.keys(genres).length).toBeGreaterThan(0);
    const expectedTime = 1;
    const recordedShortsTime = Object.values(genres).reduce((sum, g) => sum + (g.shorts || 0), 0);
    expect(recordedShortsTime).toBeGreaterThan(0);
    expect(Math.abs(recordedShortsTime - expectedTime)).toBeLessThanOrEqual(0.1);
    // Verify that no video time is recorded.
    const recordedVideoTime = Object.values(genres).reduce((sum, g) => sum + (g.video || 0), 0);
    expect(recordedVideoTime).toBe(0);
  });

  test('Test 5: Accumulates time on a single website without navigation', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    await page.waitForTimeout(61000);
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const recordedTime = trackingData.sessions[today]['example.com'].time;
    const elapsedTime = (Date.now() - startTime) / 60000;
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.1);
  });

  test('Test 6: Accumulates YouTube video time without navigation', async ({ page, context }) => {
    test.setTimeout(80000);
    const backgroundPage = await getBackgroundPage(context);
    await backgroundPage.evaluate(() => {
      if (!chrome.tabs) chrome.tabs = {};
      chrome.tabs.sendMessage = (tabId, message, callback) => {
        if (message.type === 'get_youtube_genre') {
          callback({ genre: 'music' });
        }
      };
    });
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await page.goto(videoUrl);
    await page.waitForTimeout(61000);
    const bgPage = await getBackgroundPage(context);
    const today = getCurrentDate();
    const youtubeData = await waitForYouTubeData(bgPage, today);
    expect(youtubeData).toBeDefined();
    const genres = youtubeData.genres;
    const expectedTime = 1;
    const totalVideoTime = Object.values(genres).reduce((sum, g) => sum + (g.video || 0), 0);
    expect(totalVideoTime).toBeGreaterThan(0);
    expect(Math.abs(totalVideoTime - expectedTime)).toBeLessThanOrEqual(0.1);
    // Ensure no shorts time is recorded.
    const recordedShortsTime = Object.values(genres).reduce((sum, g) => sum + (g.shorts || 0), 0);
    expect(recordedShortsTime).toBe(0);
  });

  test('Test 7: Tracks time correctly when switching between tabs', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('https://example.com');
    await page1.waitForTimeout(5000);
    const page2 = await context.newPage();
    await page2.goto('https://google.com');
    await page2.waitForTimeout(5000);
    await page1.bringToFront();
    await page1.waitForTimeout(5000);
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const exampleTime = trackingData.sessions[today]['example.com'].time;
    const googleTime = trackingData.sessions[today]['google.com'].time;
    expect(Math.abs(exampleTime - (10 / 60))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(googleTime - (5 / 60))).toBeLessThanOrEqual(0.1);
  });

  test('Test 8: Retrieves a valid favicon icon for a domain', async ({ page, context }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
    // Extra wait to let favicon update.
    await page.waitForTimeout(3000);
    const backgroundPage = await getBackgroundPage(context);
    const trackingData = await backgroundPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const iconUrl = trackingData.sessions[today]['example.com'].icon;
    expect(iconUrl).toBeDefined();
    expect(iconUrl).toMatch(/^https?:\/\//);
  });

  test('Test 9: Does not record YouTube data when scrapping is disabled', async ({ page, context }) => {
    const backgroundPage = await getBackgroundPage(context);
    await backgroundPage.evaluate(() => {
      chrome.storage.sync.set({ YoutubeContentScrapping: false });
    });
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(15000);
    const interactionData = await backgroundPage.evaluate(() => interactionData);
    const today = getCurrentDate();
    const youtubeData = interactionData && interactionData.youtube && interactionData.youtube[today];
    if (youtubeData) {
      const totalVideoTime = Object.values(youtubeData.genres).reduce((sum, g) => sum + (g.video || 0), 0);
      expect(totalVideoTime).toBe(0);
    } else {
      expect(youtubeData).toBeUndefined();
    }
  });

  test('Test 10: Comprehensive user transition simulation', async ({ page, context }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
    await page.goto('https://google.com');
    await page.waitForTimeout(5000);
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(15000);
    const bgPage = await getBackgroundPage(context);
    await bgPage.evaluate(() => {
      chrome.storage.sync.set({ YoutubeContentScrapping: false });
    });
    await page.goto('https://www.youtube.com/watch?v=abcdefg');
    await page.waitForTimeout(15000);
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
    const backgroundPageFinal = await getBackgroundPage(context);
    const trackingData = await backgroundPageFinal.evaluate(() => trackingData);
    const interactionData = await backgroundPageFinal.evaluate(() => interactionData);
    const today = getCurrentDate();
    const exampleTime = trackingData.sessions[today]['example.com'].time;
    expect(Math.abs(exampleTime - (10 / 60))).toBeLessThanOrEqual(0.1);
    const googleTime = trackingData.sessions[today]['google.com'].time;
    expect(Math.abs(googleTime - (5 / 60))).toBeLessThanOrEqual(0.1);
    if (interactionData && interactionData.youtube && interactionData.youtube[today]) {
      const totalVideoTime = Object.values(interactionData.youtube[today].genres).reduce((sum, g) => sum + (g.video || 0), 0);
      expect(Math.abs(totalVideoTime - (15 / 60))).toBeLessThanOrEqual(0.1);
    }
  });

  // --- Updated idle save tests ---
  test('Test 11: No extra idle save when idle period is < 40 seconds', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    // Wait 30 seconds.
    await page.waitForTimeout(30000);
    const bgPage = await getBackgroundPage(context);
    // Simulate window losing focus (idle) by dispatching a focus-change event.
    await bgPage.evaluate(() => {
      chrome.windows.onFocusChanged.dispatch(chrome.windows.WINDOW_ID_NONE);
    });
    // Wait a short time after blur.
    await page.waitForTimeout(5000);
    const trackingData = await bgPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const recordedTime = trackingData.sessions[today]['example.com'].time;
    const elapsedTime = (Date.now() - startTime) / 60000;
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.1);
  });

  test('Test 12: Idle save triggered after 60 seconds of idle', async ({ page, context }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    // Wait 60 seconds.
    await page.waitForTimeout(60000);
    const bgPage = await getBackgroundPage(context);
    // Simulate window losing focus.
    await bgPage.evaluate(() => {
      chrome.windows.onFocusChanged.dispatch(chrome.windows.WINDOW_ID_NONE);
    });
    // Wait a short time to let idle save complete.
    await page.waitForTimeout(1000);
    const trackingData = await bgPage.evaluate(() => trackingData);
    const today = getCurrentDate();
    const recordedTime = trackingData.sessions[today]['example.com'].time;
    const elapsedTime = (Date.now() - startTime) / 60000;
    expect(Math.abs(recordedTime - elapsedTime)).toBeLessThanOrEqual(0.1);
  });

  // --- New test for verifying genre extraction for different content ---
  test('Test 15: Verify YouTube genre extraction for music and gaming videos', async ({ page, context }) => {
    test.setTimeout(180000);
    const backgroundPage = await getBackgroundPage(context);
    
    // Part 1: Simulate a music video.
    await backgroundPage.evaluate(() => {
      if (!chrome.tabs) chrome.tabs = {};
      chrome.tabs.sendMessage = (tabId, message, callback) => {
        if (message.type === 'get_youtube_genre') {
          callback({ genre: 'music' });
        }
      };
    });
    const musicVideoUrl = 'https://www.youtube.com/watch?v=musicVideoTest';
    await page.goto(musicVideoUrl);
    await page.waitForTimeout(61000); // Wait ~61 seconds for accumulation
    const bgAfterMusic = await getBackgroundPage(context);
    const today = getCurrentDate();
    const youtubeDataMusic = await waitForYouTubeData(bgAfterMusic, today);
    expect(youtubeDataMusic).toBeDefined();
    const genresAfterMusic = youtubeDataMusic.genres;
    expect(genresAfterMusic.music).toBeDefined();
    expect(genresAfterMusic.music.video).toBeGreaterThan(0);
    
    // Part 2: Simulate a gaming video.
    await backgroundPage.evaluate(() => {
      if (!chrome.tabs) chrome.tabs = {};
      chrome.tabs.sendMessage = (tabId, message, callback) => {
        if (message.type === 'get_youtube_genre') {
          callback({ genre: 'gaming' });
        }
      };
    });
    const gamingVideoUrl = 'https://www.youtube.com/watch?v=gamingVideoTest';
    await page.goto(gamingVideoUrl);
    await page.waitForTimeout(61000); // Wait ~61 seconds for accumulation
    const bgAfterGaming = await getBackgroundPage(context);
    const youtubeDataGaming = await waitForYouTubeData(bgAfterGaming, today);
    expect(youtubeDataGaming).toBeDefined();
    const genresAfterGaming = youtubeDataGaming.genres;
    expect(genresAfterGaming.gaming).toBeDefined();
    expect(genresAfterGaming.gaming.video).toBeGreaterThan(0);
    
    // Additionally, ensure that the genres are distinct.
    expect(Object.keys(genresAfterMusic)).toContain('music');
    expect(Object.keys(genresAfterGaming)).toContain('gaming');
  });

});
