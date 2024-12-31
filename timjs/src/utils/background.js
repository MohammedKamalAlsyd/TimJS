// Initialize tracking data structure
let trackingData = {
  sessions: {}, // Per-day website session tracking
  browsing: {}, // Total browsing time per day
  total_browsing_time: 0, // Overall browsing time across all days
  urlsOpened: {}, // Total URLs opened per day
  total_urls_opened: 0 // Total URLs opened across all days
};

let activeTab = null;
let sessionStart = null;
let prevWebsite = null;

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
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().split("T")[0];
}

// Helper function to construct the Favicon API URL
function getFaviconUrl(url) {
  return `chrome-extension://${
    chrome.runtime.id
  }/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
}

// Restore previously saved data on extension startup
chrome.storage.local.get("trackingData", (data) => {
  if (data.trackingData) {
    trackingData = data.trackingData;
    console.log("Restored tracking data:", trackingData);
  }
});

// Function to save collected data locally
function saveData() {
  chrome.storage.local.set({ trackingData }, () => {
    console.log("Tracking Data Saved:", trackingData);
  });
}

// Function to periodically update and save data
function periodicUpdateAndSave() {
  if (activeTab) {
    const sessionEnd = new Date();
    const timeSpent = Math.max((sessionEnd - sessionStart) / 1000 / 60, 0); // Time in minutes
    saveWebsiteTime(activeTab.url, timeSpent);

    // Handle YouTube-specific scrapping
    if (isYouTubePage(activeTab.url)) {
      handleYouTubeTab(activeTab.id, timeSpent);
    }

    sessionStart = new Date(); // Reset session start time
  }
  saveData();
  setTimeout(periodicUpdateAndSave, 30000); // Schedule the next update and save in 30 sec
}

// Start the periodic update and save function
setTimeout(periodicUpdateAndSave, 30000);

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
  chrome.storage.local.get(["youtube_scrapping"], (result) => {
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];

    let youtubeScrapping = result.youtube_scrapping || {};
    let todayData = youtubeScrapping[todayDate] || { genres: {} };

    // Update genre data for the specific type (video/shorts)
    const genreData = todayData.genres[scrapedData.genre] || { video: 0, shorts: 0 };
    genreData[scrapedData.type] = (genreData[scrapedData.type] || 0) + timeSpent;
    todayData.genres[scrapedData.genre] = genreData;

    // Save the updated data back
    youtubeScrapping[todayDate] = todayData;

    chrome.storage.local.set({ youtube_scrapping: youtubeScrapping }, () => {
      console.log("Updated YouTube scrapping data:", youtubeScrapping);
    });
  });
}

// Function to handle YouTube tab
function handleYouTubeTab(tabId, timeSpent) {
  chrome.storage.sync.get("YoutubeContentScrapping", (data) => {
    if (data.YoutubeContentScrapping) {
      // Execute script to get video details
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => {
            const scriptText = document.evaluate('//*[@id="microformat"]/player-microformat-renderer/script/text()', document, null, XPathResult.STRING_TYPE, null).stringValue;
            try {
              // Parse the JSON data from the scriptText
              const videoData = JSON.parse(scriptText);
              const genre = videoData.genre || "Unknown"; // Default to "Unknown" if genre is not found
              const type = window.location.href.includes("/shorts/") ? "shorts" : "video";
              return {
                genre: genre,
                type: type,
                timestamp: Date.now(),
              };
            } catch (error) {
              console.error("Error parsing video metadata:", error);
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
            const scrapedData = results[0].result;
            console.log("YouTube Scrapping Data:", scrapedData);
            updateYouTubeScrappingData(scrapedData, timeSpent);
          } else {
            console.error("No results returned from script execution.");
          }
        }
      );
    }
  });
}

// Function to track website usage
function trackWebsiteUsage(tab) {
  if (!tab || !tab.url || isExcludedUrl(tab.url)) return;

  const currentDomain = extractDomain(tab.url);
  if (!currentDomain) return;

  const todayDate = getCurrentDate();

  // Initialize session start time if this is the first tab
  if (!sessionStart) sessionStart = new Date();

  // Calculate time spent on the previous tab
  if (activeTab && activeTab.url !== tab.url) {
      const sessionEnd = new Date();
      const timeSpent = Math.max((sessionEnd - sessionStart) / 1000 / 60, 0); // Time in minutes
      saveWebsiteTime(activeTab.url, timeSpent);

      // Handle YouTube-specific scrapping
      if (isYouTubePage(activeTab.url)) {
          handleYouTubeTab(activeTab.id, timeSpent);
      }
  }

  // Update session start time for the new tab
  sessionStart = new Date();
  activeTab = tab;

  // Initialize today's sessions data if not present
  if (!trackingData.sessions[todayDate]) {
      trackingData.sessions[todayDate] = {};
  }

  // Initialize current domain data for today if not present
  if (!trackingData.sessions[todayDate][currentDomain]) {
      trackingData.sessions[todayDate][currentDomain] = {
          icon: getFaviconUrl(tab.url),
          time: 0,
          nextWebsites: {},
      };
  }

  // Track transitions between websites
  if (prevWebsite && prevWebsite !== currentDomain) {
      const nextWebsites =
          trackingData.sessions[todayDate][prevWebsite].nextWebsites;
      nextWebsites[currentDomain] = (nextWebsites[currentDomain] || 0) + 1;
  }

  prevWebsite = currentDomain;

  // Track URLs opened
  if (!trackingData.urlsOpened[todayDate]) {
      trackingData.urlsOpened[todayDate] = 0;
  }
  trackingData.urlsOpened[todayDate] += 1;
  trackingData.total_urls_opened += 1;

  // Save data after every site update
  saveData();
}

// Function to save time spent on a website
function saveWebsiteTime(url, timeSpent) {
  const domain = extractDomain(url);
  const todayDate = getCurrentDate();

  if (!trackingData.sessions[todayDate][domain]) {
    trackingData.sessions[todayDate][domain] = {
      icon: getFaviconUrl(url),
      time: timeSpent,
      nextWebsites: {},
    };
  } else {
    trackingData.sessions[todayDate][domain].time += timeSpent;
  }

  // Update daily browsing time
  trackingData.browsing[todayDate] =
    (trackingData.browsing[todayDate] || 0) + timeSpent;

  // Update total browsing time
  trackingData.total_browsing_time += timeSpent;

  console.log(`Saved time for domain ${domain}: ${timeSpent} minutes`);
}

// Event listener: track tab updates (like switching or loading a new website)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    trackWebsiteUsage(tab);
  }
});

// Event listener: track tab switching
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    trackWebsiteUsage(tab);
  });
});

// Event listener: handle browser close event
chrome.runtime.onSuspend.addListener(() => {
  saveData();
});

// Event listener: load the last saved data when the browser reopens
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("trackingData", (data) => {
    if (data.trackingData) {
      trackingData = data.trackingData;
      console.log("Data loaded on startup:", trackingData);
    }
  });
});


// Function to load test data (for testing only)
function loadTestData() {
  const testData = {
    sessions: {
      // Older than 30 days - should be excluded in processing
      "2024-11-20": {
        "old-example.com": {
          icon: "https://old-example.com/favicon.ico",
          time: 120,
          nextWebsites: {
            "another-old-example.com": 5,
          },
        },
        "another-old-example.com": {
          icon: "https://another-old-example.com/favicon.ico",
          time: 50,
          nextWebsites: {},
        },
      },
      // Data within the last 30 days
      "2024-11-30": {
        "example.com": {
          icon: "https://example.com/favicon.ico",
          time: 35,
          nextWebsites: {
            "another-example.com": 2,
            "testsite.com": 1,
          },
        },
        "another-example.com": {
          icon: "https://another-example.com/favicon.ico",
          time: 20,
          nextWebsites: {
            "example.com": 1,
          },
        },
      },
      "2024-12-05": {
        "testsite.com": {
          icon: "https://testsite.com/favicon.ico",
          time: 45,
          nextWebsites: {
            "example.com": 3,
          },
        },
      },
      "2024-12-10": {
        "sample.com": {
          icon: "https://sample.com/favicon.ico",
          time: 25,
          nextWebsites: {},
        },
      },
      "2024-12-15": {
        "example.com": {
          icon: "https://example.com/favicon.ico",
          time: 60,
          nextWebsites: {
            "another-example.com": 4,
          },
        },
        "another-example.com": {
          icon: "https://another-example.com/favicon.ico",
          time: 30,
          nextWebsites: {},
        },
      },
      "2024-12-20": {
        "testsite.com": {
          icon: "https://testsite.com/favicon.ico",
          time: 15,
          nextWebsites: {
            "example.com": 1,
          },
        },
      },
      "2024-12-25": {
        "example.com": {
          icon: "https://example.com/favicon.ico",
          time: 90,
          nextWebsites: {
            "sample.com": 2,
          },
        },
        "sample.com": {
          icon: "https://sample.com/favicon.ico",
          time: 50,
          nextWebsites: {},
        },
      },
    },
    browsing: {
      // Older than 30 days
      "2024-11-20": 170,
      // Data within the last 30 days
      "2024-11-30": 55,
      "2024-12-05": 45,
      "2024-12-10": 25,
      "2024-12-15": 90,
      "2024-12-20": 15,
      "2024-12-25": 140,
    },
    urlsOpened: {
      // Older than 30 days
      "2024-11-20": 20,
      // Data within the last 30 days
      "2024-11-30": 12,
      "2024-12-05": 8,
      "2024-12-10": 5,
      "2024-12-15": 10,
      "2024-12-20": 3,
      "2024-12-25": 18,
    },
    total_browsing_time: 370,
    total_urls_opened: 56,
  };

  // delete old data
  deleteLocalStorage();

  // assign test data
  chrome.storage.local.set({ trackingData: testData }, () => {
    trackingData = testData;
  });
}


// Function to delete all local storage (for testing only)
function deleteLocalStorage() {
  chrome.storage.local.clear(() => {
    console.log(
      "Local storage cleared. This section is for testing and should be removed later."
    );
  });
}


// Add a command to clear local storage (for testing only)
chrome.commands.onCommand.addListener((command) => {
  if (command === "clear_local_storage") {
    deleteLocalStorage();
  } else if (command === "load_test_data") {
    loadTestData();
  }
});