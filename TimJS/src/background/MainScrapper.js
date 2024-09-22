let websiteData = {};
let lastUrl = '';
let startTime = 0;

const saveData = () => {
  chrome.storage.local.set({ websiteData }, () => {
    console.log("Data saved:", websiteData);
  });
};

const loadData = () => {
  chrome.storage.local.get('websiteData', (result) => {
    websiteData = result.websiteData || {}; // Initialize if data doesn't exist
    console.log("Data loaded:", websiteData);
  });
};

// Utility function to check if the URL is valid (not an internal Chrome or extension page)
const isValidUrl = (url) => {
  return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://') && url !== 'about:blank';
};

// Function to track the active tab
const trackActiveTab = (tab) => {
  const currentUrl = new URL(tab.url).hostname;

  if (!isValidUrl(tab.url)) return;  // Ignore invalid URLs

  if (currentUrl !== lastUrl) {
    if (lastUrl && websiteData[lastUrl]) {
      // Update the time spent on the last URL
      const duration = Math.round((Date.now() - startTime) / 60000); // in minutes
      websiteData[lastUrl].time += duration;
    }

    if (!websiteData[currentUrl]) {
      websiteData[currentUrl] = {
        open_freq: 1,
        time: 0,
        icon: tab.favIconUrl || 'default-icon.png'
      };
    } else {
      websiteData[currentUrl].open_freq++;
    }

    lastUrl = currentUrl;
    startTime = Date.now();
  }
};

// Load data on extension startup
loadData();

// Track tab activation (when switching between tabs)
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      trackActiveTab(tab);
    }
  });
});

// Track tab updates (when a tab changes its URL, like navigating to a new page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    trackActiveTab(tab);
  }
});

// Save data every 10 minutes
setInterval(saveData, 10 * 60 * 1000);

// Save data when the extension is unloaded
chrome.runtime.onSuspend.addListener(saveData);
