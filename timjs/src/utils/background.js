// ------------------------------
// User Session Tracking Script
// ------------------------------

// Tracking data structures
let trackingData = {
  sessions: {},          // { date: { domain: { icon, time, nextWebsites } } }
  browsing: {},          // { date: totalTime }
  total_browsing_time: 0, // Overall browsing time (in minutes)
  urlsOpened: {},        // { date: count }
  total_urls_opened: 0   // Total URLs opened across all days
};

let interactionData = {
  youtube: {} // { date: { genres: { genre: { video, shorts } } } }
};

// State variables
let focusedWindowId = -1;               // ID of the currently focused window (-1 if none)
let activeTabs = {};                    // { windowId: { tabId, domain, startTime } }
let prevWebsites = {};                  // { windowId: previous domain } for transitions
let youtubeData = {};                   // { tabId: { genre, type, timestamp } }
let domainToFavicon = {};               // Cached favicon URLs per domain

// Excluded URL prefixes (won't be tracked)
const excludedUrls = [
  "chrome:",
  "chrome-extension:",
  "file:",
  "about:",
  "edge:",
  "brave:",
];

// ------------------------------
// Helper Functions
// ------------------------------

/** Checks if a URL should be excluded from tracking */
function isExcludedUrl(url) {
  return excludedUrls.some(prefix => url.startsWith(prefix));
}

/** Extracts the domain from a URL */
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  } catch (e) {
    console.error("Error extracting domain:", e);
    return null;
  }
}

/** Returns the current date in "YYYY-MM-DD" format */
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

// ------------------------------
// Data Saving Functions
// ------------------------------

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
  chrome.storage.local.set({ trackingData, interactionData }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error saving data to local storage:", chrome.runtime.lastError);
    } else {
      console.log("Data saved successfully.");
    }
  });
}

/**
 * Records the time spent on a given website domain.
 *
 * @param {string} domain - The domain name.
 * @param {number} timeSpent - Time in minutes.
 */
function saveWebsiteTime(domain, timeSpent) {
  if (!domain || timeSpent <= 0) return;
  const todayDate = getCurrentDate();
  
  if (!trackingData.sessions[todayDate]) trackingData.sessions[todayDate] = {};
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

/**
 * Updates YouTube interaction data with the scraped data.
 *
 * @param {object} scrapedData - Data scraped from the YouTube page.
 * @param {number} timeSpent - Time in minutes.
 */
function updateYouTubeScrappingData(scrapedData, timeSpent) {
  if (!scrapedData || timeSpent <= 0) return;
  const todayDate = getCurrentDate();
  if (!interactionData.youtube[todayDate]) interactionData.youtube[todayDate] = { genres: {} };
  const todayData = interactionData.youtube[todayDate];
  const genreData = todayData.genres[scrapedData.genre] || { video: 0, shorts: 0 };
  genreData[scrapedData.type] = (genreData[scrapedData.type] || 0) + timeSpent;
  todayData.genres[scrapedData.genre] = genreData;
}

// ------------------------------
// YouTube Data Extraction
// ------------------------------

/** Extracts YouTube data from the page */
function extractYouTubeData() {
  console.log("Attempting to extract YouTube data...");
  const scripts = document.querySelectorAll("script");
  let playerResponse = null;
  for (const script of scripts) {
    if (script.textContent.includes("ytInitialPlayerResponse")) {
      const index = script.textContent.indexOf("ytInitialPlayerResponse");
      if (index === -1) continue;
      const start = script.textContent.indexOf("{", index);
      if (start === -1) continue;
      let braceCount = 1, end = start + 1;
      while (end < script.textContent.length && braceCount > 0) {
        if (script.textContent[end] === "{") braceCount++;
        else if (script.textContent[end] === "}") braceCount--;
        end++;
      }
      if (braceCount === 0) {
        const jsonStr = script.textContent.substring(start, end);
        try {
          playerResponse = JSON.parse(jsonStr);
          break;
        } catch (e) {
          console.error("Failed to parse ytInitialPlayerResponse JSON:", e);
        }
      }
    }
  }
  const type = window.location.href.includes("/shorts/") ? "shorts" : "video";
  if (playerResponse && playerResponse.videoDetails && playerResponse.videoDetails.category) {
    const genre = playerResponse.videoDetails.category;
    return { genre, type, timestamp: Date.now() };
  } else {
    return { genre: "Unknown", type, timestamp: Date.now() };
  }
}

// ------------------------------
// Timer and Transition Handling
// ------------------------------

/**
 * Records the active tab’s time (calculates elapsed time, saves it, and resets the timer).
 *
 * @param {number} windowId - The window ID.
 */
function recordActiveTabTime(windowId) {
  if (focusedWindowId !== -1 && activeTabs[focusedWindowId]) {
    const { domain, startTime, tabId } = activeTabs[focusedWindowId];
    const timeSpent = (Date.now() - startTime) / 60000; // minutes
    saveWebsiteTime(domain, timeSpent);
    if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
      updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
    }
    // Reset timer for the active tab.
    activeTabs[focusedWindowId].startTime = Date.now();
  }
}

/** Checks if a URL is a YouTube page */
function isYouTubePage(url) {
  return url && url.includes("https://www.youtube.com/");
}

/** Periodically update (every 15 sec) the time tracking and save data */
function periodicUpdateAndSave() {
  recordActiveTabTime(focusedWindowId);
  saveData();
}
setInterval(periodicUpdateAndSave, 15000);

// ------------------------------
// Event Listeners
// ------------------------------

// Window focus changes: record time and update active tab info.
chrome.windows.onFocusChanged.addListener((windowId) => {
  // Save current active tab before focus change.
  if (focusedWindowId !== -1) {
    recordActiveTabTime(focusedWindowId);
  }
  focusedWindowId = windowId;
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url && !isExcludedUrl(tabs[0].url)) {
        const domain = extractDomain(tabs[0].url);
        if (domain) {
          activeTabs[windowId] = { tabId: tabs[0].id, domain, startTime: Date.now() };
          prevWebsites[windowId] = domain;
          // Update favicon using the new method.
          updateFaviconForDomain(domain, tabs[0].id);
        }
      }
      saveData();
    });
  } else {
    saveData();
  }
});

// Tab activation: record time for previous tab and update new active tab.
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
    
    // Update favicon and active tab data.
    updateFaviconForDomain(domain, tabId);
    activeTabs[windowId] = { tabId, domain, startTime: Date.now() };
    if (windowId === focusedWindowId && prevWebsites[windowId] && prevWebsites[windowId] !== domain) {
      const todayDate = getCurrentDate();
      if (!trackingData.sessions[todayDate]) trackingData.sessions[todayDate] = {};
      if (!trackingData.sessions[todayDate][prevWebsites[windowId]]) {
        trackingData.sessions[todayDate][prevWebsites[windowId]] = {
          icon: getFaviconUrl(prevWebsites[windowId]),
          time: 0,
          nextWebsites: {}
        };
      }
      const nextWebsites = trackingData.sessions[todayDate][prevWebsites[windowId]].nextWebsites;
      nextWebsites[domain] = (nextWebsites[domain] || 0) + 1;
    }
    prevWebsites[windowId] = domain;
    saveData();
  });
});

// Tab updates: record transitions, update favicon, and handle YouTube page extraction.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !isExcludedUrl(tab.url)) {
    const domain = extractDomain(tab.url);
    if (!domain) return;
    
    updateFaviconForDomain(domain, tabId);
    
    if (tab.active && tab.windowId === focusedWindowId) {
      if (
        activeTabs[tab.windowId] &&
        activeTabs[tab.windowId].tabId === tabId &&
        activeTabs[tab.windowId].domain !== domain
      ) {
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
            nextWebsites: {}
          };
        }
        const nextWebsites = trackingData.sessions[todayDate][prevDomain].nextWebsites;
        nextWebsites[domain] = (nextWebsites[domain] || 0) + 1;
        activeTabs[tab.windowId] = { tabId, domain, startTime: Date.now() };
        prevWebsites[tab.windowId] = domain;
      } else if (!activeTabs[tab.windowId]) {
        activeTabs[tab.windowId] = { tabId, domain, startTime: Date.now() };
        prevWebsites[tab.windowId] = domain;
      }
      
      const todayDate = getCurrentDate();
      trackingData.urlsOpened[todayDate] = (trackingData.urlsOpened[todayDate] || 0) + 1;
      trackingData.total_urls_opened += 1;
      
      // If the page is YouTube, extract additional data.
      if (isYouTubePage(tab.url)) {
        chrome.storage.local.get("YoutubeContentScrapping", (data) => {
          if (data.YoutubeContentScrapping !== false) {
            chrome.scripting.executeScript(
              {
                target: { tabId },
                func: extractYouTubeData,
              },
              (results) => {
                if (chrome.runtime.lastError) {
                  console.error("Error executing YouTube extraction script:", chrome.runtime.lastError);
                } else if (results && results.length > 0 && results[0].result) {
                  youtubeData[tabId] = results[0].result;
                  console.log("YouTube data extracted for tab", tabId, ":", youtubeData[tabId]);
                }
              }
            );
          }
        });
      }
    }
    saveData();
  }
});

// When a tab is removed, record its time and clean up data.
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
  saveData();
});

// When a window is removed, record its active tab's time and clean up.
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === focusedWindowId && activeTabs[windowId]) {
    const { domain, startTime, tabId } = activeTabs[windowId];
    const timeSpent = (Date.now() - startTime) / 60000;
    saveWebsiteTime(domain, timeSpent);
    if (isYouTubePage(`https://${domain}`) && youtubeData[tabId]) {
      updateYouTubeScrappingData(youtubeData[tabId], timeSpent);
    }
    focusedWindowId = -1;
  }
  delete activeTabs[windowId];
  delete prevWebsites[windowId];
  saveData();
});

// When a new tab is created, update active tab data if it is active.
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.active && tab.url && !isExcludedUrl(tab.url)) {
    const domain = extractDomain(tab.url);
    if (domain) {
      activeTabs[tab.windowId] = { tabId: tab.id, domain, startTime: Date.now() };
      prevWebsites[tab.windowId] = domain;
      updateFaviconForDomain(domain, tab.id);
      saveData();
    }
  }
});

// ------------------------------
// Startup and Installation Handling
// ------------------------------

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data on startup:", chrome.runtime.lastError);
      return;
    }
    trackingData = data.trackingData || trackingData;
    interactionData = data.interactionData || interactionData;
    deleteOldData();
    console.log("Data loaded on startup.");
    saveData();
  });
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["trackingData", "interactionData"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data on install/update:", chrome.runtime.lastError);
      return;
    }
    trackingData = data.trackingData || trackingData;
    interactionData = data.interactionData || interactionData;
    deleteOldData();
    console.log("Data loaded on install/update.");
    saveData();
  });
});

// Save data when the browser (or extension) is closing.
chrome.runtime.onSuspend.addListener(() => {
  saveData();
});
