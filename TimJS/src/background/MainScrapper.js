// Initialize website usage data
let websiteData = {};
let activeTab = null;
let sessionStart = null;
let prevWebsite = null;

// Helper function to get today's date as a string (e.g., "2024-09-24")
function getCurrentDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)); // Adjust for local time zone
    return localDate.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"
}

// Restore previously saved data on extension startup
chrome.storage.local.get("websiteData", (data) => {
    if (data.websiteData) {
        websiteData = data.websiteData;
        console.log('Restored website data:', websiteData); // Debugging log
    }
});

// Listen to tab updates (like switching or loading a new website)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        console.log('Tab updated:', tab.url); // Debugging log
        trackWebsiteUsage(tab);
    }
});

// Listen to tab switching
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        console.log('Tab switched:', tab.url); // Debugging log
        trackWebsiteUsage(tab);
    });
});

// Handle browser close event
chrome.runtime.onSuspend.addListener(() => {
    saveData();
});

// Function to track website usage
function trackWebsiteUsage(tab) {
    if (!tab || !tab.url) return;

    const currentURL = new URL(tab.url);
    const domain = currentURL.hostname;
    const todayDate = getCurrentDate();

    // Debugging log to ensure today's date is being tracked
    console.log('Tracking usage for date:', todayDate);

    // Exclude chrome-extension:// and chrome:// URLs
    if (tab.url.startsWith("chrome-extension://") || tab.url.startsWith("chrome://")) {
        console.log("Ignoring internal Chrome extension URL:", tab.url);
        return;
    }

    // If this is the first tab, start the session
    if (!sessionStart) sessionStart = new Date();

    // If user switches from a previous website, calculate the time spent
    if (activeTab && activeTab.url !== tab.url) {
        const sessionEnd = new Date();
        const timeSpent = Math.max((sessionEnd - sessionStart) / 1000 / 60, 0.5); // time in minutes, minimum 0.5 minutes
        saveWebsiteTime(activeTab.url, timeSpent);
    }

    // Update session start time for the new tab
    sessionStart = new Date();
    activeTab = tab;

    // Initialize data for today if it doesn't exist
    if (!websiteData[todayDate]) {
        websiteData[todayDate] = {};
        console.log(`Initialized data for ${todayDate}`); // Debugging log
    }

    // Get website icon URL
    const websiteIcon = tab.favIconUrl ? tab.favIconUrl : ''; // Use favicon if available

    // Metadata for the website
    const siteMetadata = {
        'open_freq': 1,
        'time': 0,
        'icon': websiteIcon, // Store only the icon URL
        'next_site': {}
    };

    // Initialize data for this domain if not present for today
    if (!websiteData[todayDate][domain]) {
        websiteData[todayDate][domain] = siteMetadata;
        console.log(`Initialized data for domain: ${domain}`); // Debugging log
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

    console.log(`Saved time for domain ${domain}: ${timeSpent} minutes`); // Debugging log
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
            console.log('Data loaded on startup:', websiteData); // Debugging log
        }
    });
});
