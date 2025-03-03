// Initialize tracking data structures
let trackingData = {
  sessions: {}, // Per-day website session tracking: { date: { domain: { icon, time, nextWebsites } } }
  browsing: {}, // Total browsing time per day: { date: time }
  total_browsing_time: 0, // Overall browsing time in minutes
  urlsOpened: {}, // Total URLs opened per day: { date: count }
  total_urls_opened: 0 // Total URLs opened across all days
};

let interactionData = {
  youtube: {} // YouTube interaction data: { date: { genres: { genre: { video, shorts } } } }
};

// State variables for tracking
let focusedWindowId = -1; // ID of the currently focused window, -1 if none
let activeTabs = {}; // { windowId: { tabId, domain, startTime } }
let prevWebsites = {}; // { windowId: prevDomain } for tracking transitions
let youtubeData = {}; // { tabId: { genre, type, timestamp } } for YouTube metadata

// List of URL prefixes to exclude from tracking
const excludedUrls = [
  "chrome:",
  "chrome-extension:",
  "file:",
  "about:",
  "edge:",
  "brave:",
];

// Helper Functions

/** Checks if a URL should be excluded from tracking */
function isExcludedUrl(url) {
  return excludedUrls.some((prefix) => url.startsWith(prefix));
}

/** Extracts the domain from a URL (e.g., "google.com" from "https://www.google.com/search") */
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  } catch (e) {
    return null; // Return null if URL parsing fails
  }
}

/** Returns the current date in "YYYY-MM-DD" format, adjusted for local timezone */
function getCurrentDate() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

/** Constructs the favicon URL for a given domain */
function getFaviconUrl(domain) {
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(`https://${domain}`)}&size=32`;
}

/** Deletes data older than 30 days from all tracked datasets */
function deleteOldData() {
  const today = new Date();
  const cutoffDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split("T")[0];

  for (const date in trackingData.sessions) {
    if (date < cutoffDate) delete trackingData.sessions[date];
  }
  for (const date in trackingData.browsing) {
    if (date < cutoffDate) delete trackingData.browsing[date];
  }
  for (const date in trackingData.urlsOpened) {
    if (date < cutoffDate) delete trackingData.urlsOpened[date];
  }
  for (const date in interactionData.youtube) {
    if (date < cutoffDate) delete interactionData.youtube[date];
  }
}

/** Saves tracking and interaction data to local storage */
function saveData() {
  chrome.storage.local.set({ trackingData, interactionData });
}

/** Saves time spent on a website domain */
function saveWebsiteTime(domain, timeSpent) {
  if (!domain || timeSpent <= 0) return;
  const todayDate = getCurrentDate();

  if (!trackingData.sessions[todayDate]) trackingData.sessions[todayDate] = {};
  if (!trackingData.sessions[todayDate][domain]) {
    trackingData.sessions[todayDate][domain] = {
      icon: getFaviconUrl(domain),
      time: timeSpent,
      nextWebsites: {},
    };
  } else {
    trackingData.sessions[todayDate][domain].time += timeSpent;
  }

  trackingData.browsing[todayDate] = (trackingData.browsing[todayDate] || 0) + timeSpent;
  trackingData.total_browsing_time += timeSpent;
}

/** Checks if a URL is a YouTube page */
function isYouTubePage(url) {
  return url && url.includes("https://www.youtube.com/");
}

/** Updates YouTube interaction data with scraped data and time spent */
function updateYouTubeScrappingData(scrapedData, timeSpent) {
  if (!scrapedData || timeSpent <= 0) return;
  const todayDate = getCurrentDate();

  if (!interactionData.youtube[todayDate]) interactionData.youtube[todayDate] = { genres: {} };
  const todayData = interactionData.youtube[todayDate];

  const genreData = todayData.genres[scrapedData.genre] || { video: 0, shorts: 0 };
  genreData[scrapedData.type] = (genreData[scrapedData.type] || 0) + timeSpent;
  todayData.genres[scrapedData.genre] = genreData;
}

// Event Listeners and Periodic Updates

/** Periodic update: calculates time for the active tab in the focused window and saves data */
function periodicUpdateAndSave() {
  if (focusedWindowId !== -1 && activeTabs[focusedWindowId]) {
    const { domain, startTime } = activeTabs[focusedWindowId];
    const timeSpent = (Date.now() - startTime) / 60000; // Time in minutes
    saveWebsiteTime(domain, timeSpent);
    const tabId = activeTabs[focusedWindowId].tabId;
    if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
      updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
    }
    activeTabs[focusedWindowId].startTime = new Date();
  }
  saveData();
  setTimeout(periodicUpdateAndSave, 15000); // Run every 15 seconds
}

// Start periodic updates
setTimeout(periodicUpdateAndSave, 15000);

/** Tracks window focus changes to attribute time to the active tab in the focused window */
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // No Chrome window is focused (e.g., user switched to another app)
    if (focusedWindowId !== -1 && activeTabs[focusedWindowId]) {
      const { domain, startTime } = activeTabs[focusedWindowId];
      const timeSpent = (Date.now() - startTime) / 60000;
      saveWebsiteTime(domain, timeSpent);
      const tabId = activeTabs[focusedWindowId].tabId;
      if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
        updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
      }
    }
    focusedWindowId = -1;
  } else {
    // A Chrome window is focused
    if (focusedWindowId !== -1 && activeTabs[focusedWindowId]) {
      const { domain, startTime } = activeTabs[focusedWindowId];
      const timeSpent = (Date.now() - startTime) / 60000;
      saveWebsiteTime(domain, timeSpent);
      const tabId = activeTabs[focusedWindowId].tabId;
      if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
        updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
      }
    }
    focusedWindowId = windowId;
    if (!activeTabs[windowId]) {
      chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url && !isExcludedUrl(tabs[0].url)) {
          const domain = extractDomain(tabs[0].url);
          if (domain) {
            activeTabs[windowId] = { tabId: tabs[0].id, domain, startTime: new Date() };
            prevWebsites[windowId] = domain;
          }
        }
      });
    } else {
      activeTabs[windowId].startTime = new Date();
    }
  }
});

/** Tracks tab activations within windows */
chrome.tabs.onActivated.addListener((activeInfo) => {
  const { tabId, windowId } = activeInfo;
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url || isExcludedUrl(tab.url)) return;
    const domain = extractDomain(tab.url);
    if (!domain) return;

    if (windowId === focusedWindowId && activeTabs[windowId]) {
      const { domain: prevDomain, startTime } = activeTabs[windowId];
      if (prevDomain !== domain) {
        const timeSpent = (Date.now() - startTime) / 60000;
        saveWebsiteTime(prevDomain, timeSpent);
        if (isYouTubePage(`https://${prevDomain}`) && youtubeData[activeTabs[windowId].tabId]) {
          updateYouTubeScrappingData(youtubeData[activeTabs[windowId].tabId], timeSpent);
        }
      }
    }

    activeTabs[windowId] = { tabId, domain, startTime: new Date() };
    if (windowId === focusedWindowId && prevWebsites[windowId] && prevWebsites[windowId] !== domain) {
      const todayDate = getCurrentDate();
      if (!trackingData.sessions[todayDate]) trackingData.sessions[todayDate] = {};
      if (!trackingData.sessions[todayDate][prevWebsites[windowId]]) {
        trackingData.sessions[todayDate][prevWebsites[windowId]] = {
          icon: getFaviconUrl(prevWebsites[windowId]),
          time: 0,
          nextWebsites: {},
        };
      }
      const nextWebsites = trackingData.sessions[todayDate][prevWebsites[windowId]].nextWebsites;
      nextWebsites[domain] = (nextWebsites[domain] || 0) + 1;
    }
    prevWebsites[windowId] = domain;
  });
});

/** Tracks tab updates (e.g., URL changes) and scrapes YouTube data */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.active && tab.windowId === focusedWindowId && tab.url && !isExcludedUrl(tab.url)) {
      const domain = extractDomain(tab.url);
      if (!domain) return;

      if (activeTabs[tab.windowId] && activeTabs[tab.windowId].tabId === tabId && activeTabs[tab.windowId].domain !== domain) {
        const { domain: prevDomain, startTime } = activeTabs[tab.windowId];
        const timeSpent = (Date.now() - startTime) / 60000;
        saveWebsiteTime(prevDomain, timeSpent);
        if (isYouTubePage(`https://${prevDomain}`) && youtubeData[tabId]) {
          updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
        }

        const todayDate = getCurrentDate();
        if (!trackingData.sessions[todayDate]) trackingData.sessions[todayDate] = {};
        if (!trackingData.sessions[todayDate][prevDomain]) {
          trackingData.sessions[todayDate][prevDomain] = {
            icon: getFaviconUrl(prevDomain),
            time: 0,
            nextWebsites: {},
          };
        }
        const nextWebsites = trackingData.sessions[todayDate][prevDomain].nextWebsites;
        nextWebsites[domain] = (nextWebsites[domain] || 0) + 1;

        activeTabs[tab.windowId] = { tabId, domain, startTime: new Date() };
        prevWebsites[tab.windowId] = domain;
      } else if (!activeTabs[tab.windowId]) {
        activeTabs[tab.windowId] = { tabId, domain, startTime: new Date() };
        prevWebsites[tab.windowId] = domain;
      }

      // Track URLs opened
      const todayDate = getCurrentDate();
      trackingData.urlsOpened[todayDate] = (trackingData.urlsOpened[todayDate] || 0) + 1;
      trackingData.total_urls_opened += 1;
    }

    // Scrape YouTube data if applicable
    if (isYouTubePage(tab.url)) {
      chrome.storage.sync.get("YoutubeContentScrapping", (data) => {
        if (data.YoutubeContentScrapping) {
          chrome.scripting.executeScript(
            {
              target: { tabId },
              func: () => {
                const scriptText = document.evaluate(
                  '//*[@id="microformat"]/player-microformat-renderer/script/text()',
                  document,
                  null,
                  XPathResult.STRING_TYPE,
                  null
                ).stringValue;
                try {
                  const videoData = JSON.parse(scriptText);
                  return {
                    genre: videoData.genre || "Unknown",
                    type: window.location.href.includes("/shorts/") ? "shorts" : "video",
                    timestamp: Date.now(),
                  };
                } catch (error) {
                  return {
                    genre: "Unknown",
                    type: window.location.href.includes("/shorts/") ? "shorts" : "video",
                    timestamp: Date.now(),
                  };
                }
              },
            },
            (results) => {
              if (results && results.length > 0) {
                youtubeData[tabId] = results[0].result;
              }
            }
          );
        }
      });
    }
  }
});

/** Handles tab removal to clean up state and save time */
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const windowId = removeInfo.windowId;
  if (activeTabs[windowId] && activeTabs[windowId].tabId === tabId) {
    if (windowId === focusedWindowId) {
      const { domain, startTime } = activeTabs[windowId];
      const timeSpent = (Date.now() - startTime) / 60000;
      saveWebsiteTime(domain, timeSpent);
      if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
        updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
      }
    }
    delete activeTabs[windowId];
    delete prevWebsites[windowId];
  }
  delete youtubeData[tabId];
});

/** Handles window removal to clean up state and save time */
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === focusedWindowId && activeTabs[windowId]) {
    const { domain, startTime } = activeTabs[windowId];
    const timeSpent = (Date.now() - startTime) / 60000;
    saveWebsiteTime(domain, timeSpent);
    const tabId = activeTabs[windowId].tabId;
    if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
      updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
    }
    focusedWindowId = -1;
  }
  delete activeTabs[windowId];
  delete prevWebsites[windowId];
});

/** Saves data when the browser is closing */
chrome.runtime.onSuspend.addListener(() => {
  saveData();
});

/** Loads data and cleans up old data on startup */
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
    if (data.trackingData) trackingData = data.trackingData;
    if (data.interactionData) interactionData = data.interactionData;
    deleteOldData();
  });
});