// ------------------------------
// Background Script (background.js)
// ------------------------------

// Initialize tracking data structure.
let trackingData = {
  sessions: {},         // Per-day website session tracking
  browsing: {},         // Total browsing time per day
  total_browsing_time: 0, // Overall browsing time across all days
  urlsOpened: {},       // Total URLs opened per day
  total_urls_opened: 0  // Overall count of URLs opened
};

let interactionData = {
  youtube: {}           // YouTube interaction data
};

// Active tab data per window.
let activeTabs = {};     // { [windowId]: { tab, sessionStart } }
let prevWebsites = {};   // { [windowId]: previous website domain }

// (ADDED) Tab status map to track loading status.
let tabStatuses = {};    // { [tabId]: "loading" | "complete" }

// Favicon cache per domain.
const domainToFavicon = {};

// List of URL prefixes to exclude from tracking.
const excludedUrls = [
  "chrome:",
  "chrome-extension:",
  "file:",
  "about:",
];

function isExcludedUrl(url) {
  return excludedUrls.some(prefix => url.startsWith(prefix));
}

// Helper: Extract domain from a URL.
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  } catch (e) {
    return null;
  }
}

// Helper: Get today's date in "YYYY-MM-DD" format.
function getCurrentDate() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

// Favicon retrieval functions.
function getFaviconUrl(domain) {
  if (domainToFavicon[domain]) {
    return domainToFavicon[domain];
  }
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

async function fetchFaviconUrl(domain, tabId) {
  const rootFavicon = `https://${domain}/favicon.ico`;
  try {
    const response = await fetch(rootFavicon, { method: 'HEAD' });
    if (response.ok) {
      return rootFavicon;
    }
  } catch (e) {}
  
  if (tabId) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const link = document.querySelector('link[rel="shortcut icon"]') || document.querySelector('link[rel="icon"]');
          return link ? link.href : null;
        }
      });
      if (result && result.result) {
        return result.result;
      }
    } catch (e) {}
  }
  
  const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  try {
    const response = await fetch(ddgUrl, { method: 'HEAD' });
    if (response.ok) {
      return ddgUrl;
    }
  } catch (e) {}
  
  const googleUrl = `http://www.google.com/s2/favicons?domain=${domain}`;
  return googleUrl;
}

// Asynchronously update favicon cache for a domain.
function updateFaviconForDomain(domain, tabId) {
  fetchFaviconUrl(domain, tabId)
    .then(faviconUrl => {
      if (faviconUrl) {
        domainToFavicon[domain] = faviconUrl;
      }
    })
    .catch(() => {});
}

// Delete data older than 30 days.
function deleteOldData() {
  const today = new Date();
  const cutoffDate = new Date(today.setDate(today.getDate() - 30))
    .toISOString()
    .split("T")[0];

  for (const date in trackingData.sessions) {
    if (date < cutoffDate) {
      delete trackingData.sessions[date];
    }
  }
  for (const date in trackingData.browsing) {
    if (date < cutoffDate) {
      delete trackingData.browsing[date];
    }
  }
  for (const date in trackingData.urlsOpened) {
    if (date < cutoffDate) {
      delete trackingData.urlsOpened[date];
    }
  }
  for (const date in interactionData.youtube) {
    if (date < cutoffDate) {
      delete interactionData.youtube[date];
    }
  }
}

// Restore previously saved data on extension startup.
chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
  if (data.trackingData) {
    trackingData = data.trackingData;
  }
  if (data.interactionData) {
    interactionData = data.interactionData;
  }
  deleteOldData();
});

// Save data locally.
function saveData() {
  chrome.storage.local.set({ trackingData, interactionData });
}

// Update YouTube scrapping data.
function updateYouTubeScrappingData(scrapedData, timeSpent) {
  chrome.storage.local.get(["interactionData"], (result) => {
    const todayDate = getCurrentDate();
    let youtubeScrapping = result.interactionData?.youtube || {};
    let todayData = youtubeScrapping[todayDate] || { genres: {} };
    const genreData = todayData.genres[scrapedData.genre] || { video: 0, shorts: 0 };
    genreData[scrapedData.type] = (genreData[scrapedData.type] || 0) + timeSpent;
    todayData.genres[scrapedData.genre] = genreData;
    youtubeScrapping[todayDate] = todayData;
    interactionData.youtube = youtubeScrapping;
    chrome.storage.local.set({ interactionData });
  });
}

// ------------------------------
// Updated function to handle YouTube tab using the content script.
// Now waits for the async genre response before updating data.
function handleYouTubeTab(tabId, timeSpent) {
  chrome.storage.sync.get("YoutubeContentScrapping", (data) => {
    if (data.YoutubeContentScrapping === false) return;
    chrome.tabs.sendMessage(tabId, { type: 'get_youtube_genre' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.genre) {
        return;
      }
      // Search activeTabs for an entry with the matching tab id.
      let activeTabInfo = null;
      for (const key in activeTabs) {
        if (activeTabs.hasOwnProperty(key)) {
          if (activeTabs[key].tab && activeTabs[key].tab.id === tabId) {
            activeTabInfo = activeTabs[key];
            break;
          }
        }
      }
      const type = (activeTabInfo && activeTabInfo.tab.url.includes("/shorts/"))
        ? "shorts" : "video";
      const scrapedData = { genre: response.genre, type, timestamp: Date.now() };
      updateYouTubeScrappingData(scrapedData, timeSpent);
    });
  });
}

// ------------------------------
// Periodically update and save data.
// - Now checks that the tab's status is "complete" before accumulating time.
// - Update frequency changed to every 2000ms (adjustable as needed).
function periodicUpdateAndSave() {
  const now = new Date();
  for (const windowId in activeTabs) {
    if (activeTabs.hasOwnProperty(windowId)) {
      const activeTabEntry = activeTabs[windowId];
      if (
        activeTabEntry &&
        activeTabEntry.tab &&
        activeTabEntry.tab.url &&
        tabStatuses[activeTabEntry.tab.id] === "complete"  // Only update if the tab is fully loaded.
      ) {
        const timeSpent = Math.max((now - activeTabEntry.sessionStart) / 1000 / 60, 0); // minutes
        saveWebsiteTime(activeTabEntry.tab.url, timeSpent);
        if (activeTabEntry.tab.url.includes("https://www.youtube.com/")) {
          handleYouTubeTab(activeTabEntry.tab.id, timeSpent);
        }
        activeTabs[windowId].sessionStart = new Date();
      }
    }
  }
  saveData();
  setTimeout(periodicUpdateAndSave, 60000);
}
setTimeout(periodicUpdateAndSave, 60000);

// ------------------------------
// Track website usage for a tab.
function trackWebsiteUsage(tab) {
  if (!tab || !tab.url || isExcludedUrl(tab.url)) return;
  const currentDomain = extractDomain(tab.url);
  if (!currentDomain) return;
  const todayDate = getCurrentDate();
  const windowId = tab.windowId;
  if (activeTabs[windowId]) {
    if (activeTabs[windowId].tab.url !== tab.url) {
      const sessionEnd = new Date();
      const timeSpent = Math.max((sessionEnd - activeTabs[windowId].sessionStart) / 1000 / 60, 0);
      saveWebsiteTime(activeTabs[windowId].tab.url, timeSpent);
      if (activeTabs[windowId].tab.url.includes("https://www.youtube.com/")) {
        handleYouTubeTab(activeTabs[windowId].tab.id, timeSpent);
      }
      if (prevWebsites[windowId] && prevWebsites[windowId] !== currentDomain) {
        // Safeguard: ensure the previous website session exists.
        if (trackingData.sessions[todayDate] && trackingData.sessions[todayDate][prevWebsites[windowId]]) {
          const nextWebsites = trackingData.sessions[todayDate][prevWebsites[windowId]].nextWebsites;
          nextWebsites[currentDomain] = (nextWebsites[currentDomain] || 0) + 1;
        }
      }
    }
  }
  activeTabs[windowId] = { tab: tab, sessionStart: new Date() };
  prevWebsites[windowId] = currentDomain;
  // Ensure sessions object for today is initialized.
  if (!trackingData.sessions[todayDate]) {
    trackingData.sessions[todayDate] = {};
  }
  if (!trackingData.sessions[todayDate][currentDomain]) {
    trackingData.sessions[todayDate][currentDomain] = {
      icon: getFaviconUrl(currentDomain),
      time: 0,
      nextWebsites: {}
    };
    updateFaviconForDomain(currentDomain, tab.id);
  }
  if (!trackingData.urlsOpened[todayDate]) {
    trackingData.urlsOpened[todayDate] = 0;
  }
  trackingData.urlsOpened[todayDate] += 1;
  trackingData.total_urls_opened += 1;
  saveData();
}

// ------------------------------
// Save time spent on a website.
// Added a safeguard to initialize the sessions object for today.
function saveWebsiteTime(url, timeSpent) {
  const domain = extractDomain(url);
  const todayDate = getCurrentDate();
  if (!trackingData.sessions[todayDate]) {
    trackingData.sessions[todayDate] = {}; // [ADDED]
  }
  if (!trackingData.sessions[todayDate][domain]) {
    trackingData.sessions[todayDate][domain] = {
      icon: getFaviconUrl(domain),
      time: timeSpent,
      nextWebsites: {}
    };
  } else {
    trackingData.sessions[todayDate][domain].time += timeSpent;
  }
  trackingData.browsing[todayDate] = (trackingData.browsing[todayDate] || 0) + timeSpent;
  trackingData.total_browsing_time += timeSpent;
}

// ------------------------------
// Listen for tab updates.
// Now updates tabStatuses and only calls trackWebsiteUsage when status is "complete".
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status) {
    tabStatuses[tabId] = changeInfo.status;
  }
  if (changeInfo.status === "complete") {
    trackWebsiteUsage(tab);
  }
});

// Clean up tabStatuses when a tab is removed.
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabStatuses[tabId];
});

// Listen for tab activation.
// Only tracks the tab if its status is "complete" to avoid premature tracking.
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.status === "complete") {
      trackWebsiteUsage(tab);
    }
  });
});

// Listen for window focus changes.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    for (const winId in activeTabs) {
      if (activeTabs.hasOwnProperty(winId)) {
        const activeTabEntry = activeTabs[winId];
        if (activeTabEntry && activeTabEntry.tab) {
          const timeSpent = Math.max((new Date() - activeTabEntry.sessionStart) / 1000 / 60, 0);
          saveWebsiteTime(activeTabEntry.tab.url, timeSpent);
          if (activeTabEntry.tab.url.includes("https://www.youtube.com/")) {
            handleYouTubeTab(activeTabEntry.tab.id, timeSpent);
          }
        }
      }
    }
    activeTabs = {};
  } else {
    chrome.windows.get(windowId, { populate: true }, (window) => {
      if (window && window.focused && window.tabs && window.tabs.length > 0) {
        const activeTab = window.tabs.find(t => t.active);
        if (activeTab) {
          trackWebsiteUsage(activeTab);
        }
      }
    });
  }
});

// Handle browser suspend (close).
chrome.runtime.onSuspend.addListener(() => {
  saveData();
});

// Restore data on browser startup.
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
    if (data.trackingData) {
      trackingData = data.trackingData;
    }
    if (data.interactionData) {
      interactionData = data.interactionData;
    }
    deleteOldData();
  });
});
