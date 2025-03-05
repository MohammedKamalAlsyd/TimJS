// Initialize tracking data structure
let trackingData = {
  sessions: {}, // Per-day website session tracking
  browsing: {}, // Total browsing time per day
  total_browsing_time: 0, // Overall browsing time across all days
  urlsOpened: {}, // Total URLs opened per day
  total_urls_opened: 0 // Total URLs opened across all days
};

let interactionData = {
  youtube: {} // YouTube interaction data
};

// Instead of single active tab variables, use objects keyed by windowId
let activeTabs = {};     // { [windowId]: { tab, sessionStart } }
let prevWebsites = {};   // { [windowId]: previous website domain }

// Cached mapping for favicons per domain
const domainToFavicon = {};

// List of URL prefixes to exclude from tracking
const excludedUrls = [
  "chrome:",
  "chrome-extension:",
  "file:",
  "about:",
  "edge:",
  "brave:",
];

// Function to check if a URL is excluded
function isExcludedUrl(url) {
  return excludedUrls.some((prefix) => url.startsWith(prefix));
}

// Helper function to extract domain from a URL
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  } catch (e) {
    return null; // Return null if URL parsing fails
  }
}

// Helper function to get today's date in "YYYY-MM-DD" format
function getCurrentDate() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

// ------------------------------
// Favicon Retrieval Functions
// ------------------------------

/**
 * Synchronous getter for favicon URL.
 * If we have a cached URL, return it; otherwise use a fallback (DuckDuckGo service).
 */
function getFaviconUrl(domain) {
  if (domainToFavicon[domain]) {
    return domainToFavicon[domain];
  }
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Asynchronously fetches the favicon for a domain using multiple methods:
 * 1. Check for the root favicon at "https://{domain}/favicon.ico" (via HEAD request)
 * 2. If available, extract from the page's <link> tags (via a content script)
 * 3. Try the DuckDuckGo favicon service
 * 4. Fall back to the Google favicon service
 *
 * @param {string} domain - The domain to fetch the favicon for.
 * @param {number} tabId - The tab ID (optional) to run content script for extraction.
 * @returns {Promise<string>} - A promise that resolves to the favicon URL.
 */
async function fetchFaviconUrl(domain, tabId) {
  // Method 1: Try the root favicon
  const rootFavicon = `https://${domain}/favicon.ico`;
  try {
    const response = await fetch(rootFavicon, { method: 'HEAD' });
    if (response.ok) {
      return rootFavicon;
    }
  } catch (e) {
    console.error(`Root favicon not available for ${domain}:`, e);
  }
  
  // Method 2: Extract from page DOM via content script
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
    } catch (e) {
      console.error(`Content script favicon extraction failed for ${domain}:`, e);
    }
  }
  
  // Method 3: DuckDuckGo favicon service
  const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  try {
    const response = await fetch(ddgUrl, { method: 'HEAD' });
    if (response.ok) {
      return ddgUrl;
    }
  } catch (e) {
    console.error(`DuckDuckGo favicon not available for ${domain}:`, e);
  }
  
  // Method 4: Fallback to Google favicon service
  const googleUrl = `http://www.google.com/s2/favicons?domain=${domain}`;
  return googleUrl;
}

/** Updates the cached favicon for a domain using the async fetchFaviconUrl() */
function updateFaviconForDomain(domain, tabId) {
  fetchFaviconUrl(domain, tabId).then(faviconUrl => {
    if (faviconUrl) {
      domainToFavicon[domain] = faviconUrl;
    }
  }).catch(e => {
    console.error(`Failed to update favicon for ${domain}:`, e);
  });
}

// Function to delete data older than 30 days
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

// Restore previously saved data on extension startup
chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
  if (data.trackingData) {
    trackingData = data.trackingData;
  }
  if (data.interactionData) {
    interactionData = data.interactionData;
  }
  deleteOldData();
  // console.log("Restored tracking data:", trackingData);
  // console.log("Restored interaction data:", interactionData);
});

// Function to save collected data locally
function saveData() {
  chrome.storage.local.set({ trackingData, interactionData }, () => {
    // console.log("Tracking Data Saved:", trackingData);
    // console.log("Interaction Data Saved:", interactionData);
  });
}

// Function to periodically update and save data for all active tabs in all windows
function periodicUpdateAndSave() {
  const now = new Date();
  for (const windowId in activeTabs) {
    if (activeTabs.hasOwnProperty(windowId)) {
      const activeTabEntry = activeTabs[windowId];
      if (activeTabEntry && activeTabEntry.tab && activeTabEntry.tab.url) {
        const timeSpent = Math.max((now - activeTabEntry.sessionStart) / 1000 / 60, 0); // in minutes
        saveWebsiteTime(activeTabEntry.tab.url, timeSpent);

        // Handle YouTube-specific scrapping if applicable
        if (isYouTubePage(activeTabEntry.tab.url)) {
          handleYouTubeTab(activeTabEntry.tab.id, timeSpent);
        }
        // Reset session start time for this window
        activeTabs[windowId].sessionStart = new Date();
      }
    }
  }
  saveData();
  setTimeout(periodicUpdateAndSave, 15000); // Schedule next update in 15 seconds
}
setTimeout(periodicUpdateAndSave, 15000);

// Function to check if a URL is a YouTube page
function isYouTubePage(url) {
  return url && url.includes("https://www.youtube.com/");
}

// Function to determine if the YouTube page is a short
function isYouTubeShorts(url) {
  return url && url.includes("https://www.youtube.com/shorts/");
}

// Function to update the stored YouTube scrapping data
function updateYouTubeScrappingData(scrapedData, timeSpent) {
  chrome.storage.local.get(["interactionData"], (result) => {
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];

    let youtubeScrapping = result.interactionData?.youtube || {};
    let todayData = youtubeScrapping[todayDate] || { genres: {} };

    // Update genre data for the specific type (video/shorts)
    const genreData = todayData.genres[scrapedData.genre] || { video: 0, shorts: 0 };
    genreData[scrapedData.type] = (genreData[scrapedData.type] || 0) + timeSpent;
    todayData.genres[scrapedData.genre] = genreData;

    // Save the updated data back
    youtubeScrapping[todayDate] = todayData;
    interactionData.youtube = youtubeScrapping;

    chrome.storage.local.set({ interactionData }, () => {
      console.log("Updated YouTube scrapping data:", interactionData.youtube);
    });
  });
}

// Function to handle YouTube tab data extraction and updating using a proxy fetch
function handleYouTubeTab(tabId, timeSpent) {
  // Check if the user has disabled YouTube content scraping
  chrome.storage.sync.get("YoutubeContentScrapping", (data) => {
    if (data.YoutubeContentScrapping === false) return;
    // Retrieve the tab info to get the URL
    chrome.tabs.get(tabId, (tab) => {
      if (tab && tab.url) {
        // Use the proxy fetch to retrieve the page source
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(tab.url)}`;
        fetch(proxyUrl)
          .then((response) => response.text())
          .then((htmlText) => {
            // Use a regular expression to extract the meta tag with itemprop="genre"
            const genreRegex = /<meta\s+itemprop=["']genre["']\s+content=["']([^"']+)["']/i;
            const match = genreRegex.exec(htmlText);
            const genre = match ? match[1] : "Unknown";
            console.log(genre)
            const type = tab.url.includes("/shorts/") ? "shorts" : "video";
            const scrapedData = { genre, type, timestamp: Date.now() };
            updateYouTubeScrappingData(scrapedData, timeSpent);
          })
          .catch((err) => {
            console.error("Failed to fetch page source for YouTube tab:", err);
          });
      }
    });
  });
}

// Function to track website usage per window
function trackWebsiteUsage(tab) {
  if (!tab || !tab.url || isExcludedUrl(tab.url)) return;

  const currentDomain = extractDomain(tab.url);
  if (!currentDomain) return;

  const todayDate = getCurrentDate();
  const windowId = tab.windowId;

  // If there is an already tracked active tab for this window, record its time if URL has changed
  if (activeTabs[windowId]) {
    if (activeTabs[windowId].tab.url !== tab.url) {
      const sessionEnd = new Date();
      const timeSpent = Math.max((sessionEnd - activeTabs[windowId].sessionStart) / 1000 / 60, 0);
      saveWebsiteTime(activeTabs[windowId].tab.url, timeSpent);

      // Handle YouTube-specific scrapping for the previous tab if needed
      if (isYouTubePage(activeTabs[windowId].tab.url)) {
        handleYouTubeTab(activeTabs[windowId].tab.id, timeSpent);
      }
      // Track transition between websites for this window
      if (prevWebsites[windowId] && prevWebsites[windowId] !== currentDomain) {
        const nextWebsites = trackingData.sessions[todayDate][prevWebsites[windowId]].nextWebsites;
        nextWebsites[currentDomain] = (nextWebsites[currentDomain] || 0) + 1;
      }
    }
  }
  // Update the active tab for this window with the new session start time
  activeTabs[windowId] = { tab: tab, sessionStart: new Date() };
  // Update the previous website for this window
  prevWebsites[windowId] = currentDomain;

  // Initialize today's session data if not already present
  if (!trackingData.sessions[todayDate]) {
    trackingData.sessions[todayDate] = {};
  }
  // Initialize current domain data for today if not present
  if (!trackingData.sessions[todayDate][currentDomain]) {
    trackingData.sessions[todayDate][currentDomain] = {
      icon: getFaviconUrl(currentDomain),
      time: 0,
      nextWebsites: {},
    };
    // Optionally update the favicon cache asynchronously
    updateFaviconForDomain(currentDomain, tab.id);
  }

  // Track URLs opened
  if (!trackingData.urlsOpened[todayDate]) {
    trackingData.urlsOpened[todayDate] = 0;
  }
  trackingData.urlsOpened[todayDate] += 1;
  trackingData.total_urls_opened += 1;

  // Save data after every update
  saveData();
}

// Function to save time spent on a website
function saveWebsiteTime(url, timeSpent) {
  const domain = extractDomain(url);
  const todayDate = getCurrentDate();

  if (!trackingData.sessions[todayDate][domain]) {
    trackingData.sessions[todayDate][domain] = {
      icon: getFaviconUrl(domain),
      time: timeSpent,
      nextWebsites: {},
    };
  } else {
    trackingData.sessions[todayDate][domain].time += timeSpent;
  }

  // Update daily browsing time
  trackingData.browsing[todayDate] = (trackingData.browsing[todayDate] || 0) + timeSpent;

  // Update total browsing time
  trackingData.total_browsing_time += timeSpent;

  // console.log(`Saved time for domain ${domain}: ${timeSpent} minutes`);
}

// Listen for tab updates (e.g. page load or URL change)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    trackWebsiteUsage(tab);
  }
});

// Listen for tab activation (switching tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    trackWebsiteUsage(tab);
  });
});

// Listen for window focus changes to accurately record time when the browser loses focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, record time for all active tabs and clear activeTabs
    for (const winId in activeTabs) {
      if (activeTabs.hasOwnProperty(winId)) {
        const activeTabEntry = activeTabs[winId];
        if (activeTabEntry && activeTabEntry.tab) {
          const timeSpent = Math.max((new Date() - activeTabEntry.sessionStart) / 1000 / 60, 0);
          saveWebsiteTime(activeTabEntry.tab.url, timeSpent);
          if (isYouTubePage(activeTabEntry.tab.url)) {
            handleYouTubeTab(activeTabEntry.tab.id, timeSpent);
          }
        }
      }
    }
    activeTabs = {}; // Clear active tabs when browser is not focused
  } else {
    // When a window gains focus, get its active tab
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

// Handle browser suspend (close) event
chrome.runtime.onSuspend.addListener(() => {
  saveData();
});

// Restore data on browser startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
    if (data.trackingData) {
      trackingData = data.trackingData;
    }
    if (data.interactionData) {
      interactionData = data.interactionData;
    }
    deleteOldData();
    // console.log("Data loaded on startup:", trackingData);
    // console.log("Interaction data loaded on startup:", interactionData);
  });
});
