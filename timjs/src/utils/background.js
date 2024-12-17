// Initialize website usage data
let websiteData = {};
let activeTab = null;
let sessionStart = null;
let prevWebsite = null;

// List of URL prefixes to exclude from tracking
const excludedUrls = ["chrome:", "file:", "about:", "edge:", "brave:"];

// Function to check if a URL is excluded
function isExcludedUrl(url) {
  return excludedUrls.some((prefix) => url.startsWith(prefix));
}

// Helper function to extract domain from a URL
function extractDomain(url) {
    try {
        const { hostname } = new URL(url);
        const parts = hostname.split('.');
        return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
    } catch (e) {
        return null; // Return null if URL parsing fails
    }
}

// Helper function to get today's date in "YYYY-MM-DD" format
function getCurrentDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
}

// Helper function to construct the Favicon API URL
function getFaviconUrl(url) {
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
}

// Restore previously saved data on extension startup
chrome.storage.local.get("websiteData", (data) => {
    if (data.websiteData) {
        websiteData = data.websiteData;
        console.log("Restored website data:", websiteData); // Debugging log
    }
});

// Function to save collected data locally
function saveData() {
    chrome.storage.local.set({ websiteData }, () => {
        console.log("Website Data Saved:", websiteData);
    });
}

// Function to delete all local storage (for testing only)
function deleteLocalStorage() {
    chrome.storage.local.clear(() => {
        console.log("Local storage cleared. This section is for testing and should be removed later.");
    });
}

// Function to track website usage
function trackWebsiteUsage(tab) {
  if (!tab || !tab.url || isExcludedUrl(tab.url)) return;

  const currentDomain = extractDomain(tab.url);
  if (!currentDomain) return;

  const todayDate = getCurrentDate();

  // If this is the first tab, start the session
  if (!sessionStart) sessionStart = new Date();

  // If user switches from a previous website, calculate the time spent
  if (activeTab && activeTab.url !== tab.url) {
      const sessionEnd = new Date();
      const timeSpent = Math.max((sessionEnd - sessionStart) / 1000 / 60, 0.5); // Time in minutes, min 0.5 mins
      saveWebsiteTime(activeTab.url, timeSpent);
  }

  // Update session start time for the new tab
  sessionStart = new Date();
  activeTab = tab;

  // Initialize data for today if it doesn't exist
  if (!websiteData[todayDate]) {
      websiteData[todayDate] = {};
  }

  // Initialize data for this domain if not present for today
  if (!websiteData[todayDate][currentDomain]) {
      websiteData[todayDate][currentDomain] = {
          icon: getFaviconUrl(tab.url), // Assign favicon URL
          time: 0,
          nextWebsites: {}
      };
  }

  // Track transitions to the next website
  if (prevWebsite && prevWebsite !== currentDomain) {
      const nextWebsites = websiteData[todayDate][prevWebsite].nextWebsites;
      if (nextWebsites[currentDomain]) {
          nextWebsites[currentDomain] += 1;
      } else {
          nextWebsites[currentDomain] = 1;
      }
  }

  prevWebsite = currentDomain;

  // Save data after every site update
  saveData();
}

// Save the time spent on a website
function saveWebsiteTime(url, timeSpent) {
    const domain = extractDomain(url);
    const todayDate = getCurrentDate();

    if (!websiteData[todayDate][domain]) {
        websiteData[todayDate][domain] = {
            icon: getFaviconUrl(url),
            time: timeSpent,
            nextWebsites: {}
        };
    } else {
        websiteData[todayDate][domain].time += timeSpent;
    }

    console.log(`Saved time for domain ${domain}: ${timeSpent} minutes`);
}

// Listen to tab updates (like switching or loading a new website)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        trackWebsiteUsage(tab);
    }
});

// Listen to tab switching
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        trackWebsiteUsage(tab);
    });
});

// Handle browser close event
chrome.runtime.onSuspend.addListener(() => {
    saveData();
});

// When browser reopens, load the last saved data
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("websiteData", (data) => {
        if (data.websiteData) {
            websiteData = data.websiteData;
            console.log("Data loaded on startup:", websiteData);
        }
    });
});

// Add a command to clear local storage (for testing only)
chrome.commands.onCommand.addListener((command) => {
    if (command === "clear_local_storage") {
        deleteLocalStorage();
    }
});
