// Initialize website usage data
let websiteData = {};
let activeTab = null;
let sessionStart = null;
let prevWebsite = null;

// Helper function to get today's date as a string (e.g., "2024-09-22")
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"
}

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
    const todayDate = getCurrentDate();

    // Exclude chrome-extension:// URLs
    if (tab.url.startsWith("chrome-extension://") || tab.url.startsWith("chrome://extensions/")) {
        console.log("Ignoring internal Chrome extension URL:", tab.url);
        return;
    }

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

    // Initialize data for today if it doesn't exist
    if (!websiteData[todayDate]) {
        websiteData[todayDate] = {};
    }

    // Get website icon URL
    const websiteIcon = tab.favIconUrl || ''; // Use favicon if available, else empty string
    const siteMetadata = {
        'open_freq': 1,
        'time': 0,
        'icon': websiteIcon, // Store only the icon URL
        'next_site': {}
    };

    // Initialize data for this domain if not present for today
    if (!websiteData[todayDate][domain]) {
        websiteData[todayDate][domain] = siteMetadata;
    } else {
        websiteData[todayDate][domain]['open_freq'] += 1;
    }

    // Track the next website user moves to (if any)
    if (prevWebsite && prevWebsite !== domain) {
        if (websiteData[todayDate][prevWebsite]['next_site'][domain]) {
            websiteData[todayDate][prevWebsite]['next_site'][domain] += 1;
        } else {
            websiteData[todayDate][prevWebsite]['next_site'][domain] = 1;
        }
    }

    prevWebsite = domain;

    // Save data after every site update
    saveData();
}

// Save the time spent on a website
function saveWebsiteTime(url, timeSpent) {
    const domain = new URL(url).hostname;
    const todayDate = getCurrentDate();

    if (!websiteData[todayDate][domain]) {
        websiteData[todayDate][domain] = {
            'open_freq': 1,
            'time': timeSpent,
            'icon': '', // Leave the icon URL empty if unavailable
            'next_site': {}
        };
    } else {
        websiteData[todayDate][domain]['time'] += timeSpent;
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
