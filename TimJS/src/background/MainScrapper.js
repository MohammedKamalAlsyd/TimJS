// Initialize website usage data
let websiteData = {};
let activeTab = null;
let sessionStart = null;
let prevWebsite = null;

// Restore previously saved data on extension startup
chrome.storage.local.get("websiteData", (data) => {
    if (data.websiteData) {
        websiteData = data.websiteData;
    }
});

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

// Function to track website usage
function trackWebsiteUsage(tab) {
    const currentURL = new URL(tab.url);
    const domain = currentURL.hostname;

    if (!sessionStart) sessionStart = new Date();

    // If user switches from a previous website, calculate the time spent
    if (activeTab && activeTab.url !== tab.url) {
        const sessionEnd = new Date();
        const timeSpent = Math.floor((sessionEnd - sessionStart) / 1000 / 60); // time in minutes
        saveWebsiteTime(activeTab.url, timeSpent);
    }

    // Update session start time for the new tab
    sessionStart = new Date();
    activeTab = tab;

    // Get website icon URL
    const websiteIcon = tab.favIconUrl || ''; // Use favicon if available, else empty string
    const siteMetadata = {
        'open_freq': 1,
        'time': 0,
        'icon': websiteIcon, // Store only the icon URL
        'next_site': {}
    };

    if (!websiteData[domain]) {
        websiteData[domain] = siteMetadata;
    } else {
        websiteData[domain]['open_freq'] += 1;
    }

    // Track the next website user moves to (if any)
    if (prevWebsite && prevWebsite !== domain) {
        if (websiteData[prevWebsite]['next_site'][domain]) {
            websiteData[prevWebsite]['next_site'][domain] += 1;
        } else {
            websiteData[prevWebsite]['next_site'][domain] = 1;
        }
    }

    prevWebsite = domain;

    // Save data after every site update
    saveData();
}

// Save the time spent on a website
function saveWebsiteTime(url, timeSpent) {
    const domain = new URL(url).hostname;

    if (websiteData[domain]) {
        websiteData[domain]['time'] += timeSpent;
    } else {
        // Handle edge cases (this shouldn't happen with correct initialization)
        websiteData[domain] = {
            'open_freq': 1,
            'time': timeSpent,
            'icon': '', // Leave the icon URL empty if unavailable
            'next_site': {}
        };
    }
}

// Save the collected data locally
function saveData() {
    chrome.storage.local.set({ 'websiteData': websiteData }, () => {
        console.log('Website Data Saved:', websiteData); // Log the data being saved
    });
}

// When browser reopens, load the last saved data
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('websiteData', (data) => {
        if (data.websiteData) {
            websiteData = data.websiteData;
        }
    });
});
