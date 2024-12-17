// Initialize website usage data
let websiteData = {};
let activeTab = null;
let sessionStart = null;
let prevWebsite = null;

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

// Restore previously saved data on extension startup
chrome.storage.local.get("websiteData", (data) => {
    if (data.websiteData) {
        websiteData = data.websiteData;
        console.log("Restored website data:", websiteData);
    }
});

// Function to save the data locally
function saveData() {
    chrome.storage.local.set({ websiteData }, () => {
        console.log("Website Data Saved:", websiteData);
    });
}

// Function to track time spent and website usage
function trackWebsiteUsage(tab) {
    if (!tab || !tab.url) return;

    const currentDomain = extractDomain(tab.url);
    const todayDate = getCurrentDate();

    // Ignore internal Chrome URLs
    if (tab.url.startsWith("chrome-extension://") || tab.url.startsWith("chrome://")) {
        return;
    }

    // Initialize session data for today if not present
    if (!websiteData[todayDate]) {
        websiteData[todayDate] = {};
    }

    // If this is the first active tab, start the session
    if (!sessionStart) sessionStart = new Date();

    // If user switches from a previous website, calculate time spent
    if (activeTab && activeTab.url !== tab.url) {
        const sessionEnd = new Date();
        const timeSpent = Math.max((sessionEnd - sessionStart) / 1000 / 60, 0.5); // Time in minutes, minimum 0.5

        saveWebsiteTime(activeTab.url, timeSpent);
    }

    // Update session start time for the new tab
    sessionStart = new Date();
    activeTab = tab;

    // Initialize data for the current domain if not present
    if (!websiteData[todayDate][currentDomain]) {
        websiteData[todayDate][currentDomain] = {
            icon: tab.favIconUrl || "",
            time: 0,
            nextWebsites: {}
        };
    }

    // Update navigation (track next websites)
    if (prevWebsite && prevWebsite !== currentDomain) {
        if (!websiteData[todayDate][prevWebsite].nextWebsites[currentDomain]) {
            websiteData[todayDate][prevWebsite].nextWebsites[currentDomain] = 0;
        }
        websiteData[todayDate][prevWebsite].nextWebsites[currentDomain]++;
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
            icon: "",
            time: timeSpent,
            nextWebsites: {}
        };
    } else {
        websiteData[todayDate][domain].time += timeSpent;
    }

    console.log(`Saved time for domain ${domain}: ${timeSpent} minutes`);
}

// Listeners for tracking tab updates and tab activation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        trackWebsiteUsage(tab);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        trackWebsiteUsage(tab);
    });
});

// Save data on browser close
chrome.runtime.onSuspend.addListener(() => {
    saveData();
});

// Restore data on browser startup
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("websiteData", (data) => {
        if (data.websiteData) {
            websiteData = data.websiteData;
            console.log("Data loaded on startup:", websiteData);
        }
    });
});
