import WebClassification from "../utils/Web Classification.json";

const WASTED_CATEGORIES = [
  "Social Media",
  "Shopping",
  "Arts & Entertainment",
  "Games",
  "Life Style & Hobbies",
  "Travel",
];

const WORKING_CATEGORIES = [
  "Technology",
  "Tools",
  "Business & Consumer Services",
  "Finance",
  "Health & Food",
  "Jobs & Careers",
  "Science & Education",
  "News & Sport",
];

const fetchFromStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
};


// General aggregation function
const aggregateData = (data, aggregationType) => {
  const dates = Object.keys(data).sort();
  let relevantDates = [];

  if (aggregationType === "day") {
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    relevantDates = latestDate ? [latestDate] : [];
  } else if (aggregationType === "week") {
    relevantDates = dates.slice(-7);
  } else if (aggregationType === "month") {
    relevantDates = dates.slice(-30);
  }

  const aggregatedValue = relevantDates.reduce((total, date) => total + (data[date] || 0), 0);
  return { aggregatedValue, relevantDates };
};


// Calculate aggregated browsing time
const calculateAggregatedBrowsingTime = (browsingData, aggregationType) => {
  const { aggregatedValue } = aggregateData(browsingData, aggregationType);
  return Math.round(aggregatedValue);
};

// Calculate aggregated URL count
const calculateAggregatedURLCount = (urlData, aggregationType) => {
  const { aggregatedValue } = aggregateData(urlData, aggregationType);
  return aggregatedValue;
};

// Get total browsing time
const getTotalBrowsingTime = (trackingData) => {
  return trackingData.total_browsing_time || 0;
};

// Get total URLs opened
const getTotalURLsOpened = (trackingData) => {
  return trackingData.total_urls_opened || 0;
};

// Calculate wasted time
const calculateWastedTime = (trackingData, relevantDates) => {
  let totalWastedTime = 0;
  relevantDates.forEach((date) => {
    const dailyData = trackingData.sessions[date] || {};
    Object.keys(dailyData).forEach((website) => {
      const siteInfo = dailyData[website];
      const category = WebClassification[website]?.Category || "Other";

      if (WASTED_CATEGORIES.includes(category)) {
        totalWastedTime += siteInfo.time;
      }
    });
  });
  return totalWastedTime;
};

// Calculate working time
const calculateWorkingTime = (trackingData, relevantDates) => {
  let totalWorkingTime = 0;
  relevantDates.forEach((date) => {
    const dailyData = trackingData.sessions[date] || {};
    Object.keys(dailyData).forEach((website) => {
      const siteInfo = dailyData[website];
      const category = WebClassification[website]?.Category || "Other";

      if (WORKING_CATEGORIES.includes(category)) {
        totalWorkingTime += siteInfo.time;
      }
    });
  });
  return totalWorkingTime;
};

// Get aggregation interval
const getAggregationInterval = (dates, aggregationType) => {
  if (aggregationType === "day") {
    return dates.length > 0 ? dates[dates.length - 1] : "No Data";
  }
  if (aggregationType === "week" || aggregationType === "month") {
    const relevantDates = aggregationType === "week" ? dates.slice(-7) : dates.slice(-30);
    return relevantDates.length > 0
      ? `${relevantDates[0]} to ${relevantDates[relevantDates.length - 1]}`
      : "No Data";
  }
  return "No Data";
};

// Process dashboard data
const processDashboardData = async (aggregationType) => {
  const trackingData = await fetchFromStorage("trackingData");
  if (!trackingData) {
    return {
      chartData: [],
      websiteDetails: [],
    };
  }

  const dates = Object.keys(trackingData.sessions).sort();
  const relevantDates = aggregateData(trackingData.sessions, aggregationType).relevantDates;

  const categoryMap = {};
  const websiteDetailsMap = {};

  relevantDates.forEach((date) => {
    const dailyData = trackingData.sessions[date] || {};
    Object.keys(dailyData).forEach((website) => {
      const siteInfo = dailyData[website];
      const category = WebClassification[website]?.Category || "Other";

      categoryMap[category] = (categoryMap[category] || 0) + siteInfo.time;

      if (!websiteDetailsMap[website]) {
        websiteDetailsMap[website] = {
          name: website,
          time: siteInfo.time,
          category,
          icon: siteInfo.icon,
        };
      } else {
        websiteDetailsMap[website].time += siteInfo.time;
      }
    });
  });

  const formattedChartData = Object.keys(categoryMap).map((category) => ({
    name: category,
    hours: (categoryMap[category] / 60).toFixed(2),
  }));

  return {
    chartData: formattedChartData,
    websiteDetails: Object.values(websiteDetailsMap),
  };
};


const retrieveYouTubeScrappingData = async (aggregationType, callback) => {
  chrome.storage.local.get(["youtube_scrapping"], (result) => {
    const scrappingData = result.youtube_scrapping || {};
    const processedData = processRadialBarData(scrappingData, aggregationType);
    callback(processedData);
  });
};

const processRadialBarData = (scrappingData, aggregationType) => {
  const dates = Object.keys(scrappingData).sort();
  const relevantDates = filterDatesByAggregation(dates, aggregationType);

  const aggregatedData = [];

  relevantDates.forEach((date) => {
    const dailyData = scrappingData[date];

    Object.entries(dailyData.genres).forEach(([genre, genreData]) => {
      let existingGenre = aggregatedData.find((item) => item.name === genre);

      if (!existingGenre) {
        existingGenre = { name: genre, Video: 0, Shorts: 0 };
        aggregatedData.push(existingGenre);
      }

      existingGenre.Video += genreData.video || 0;
      existingGenre.Shorts += genreData.shorts || 0;
    });
  });

  return aggregatedData;
};

const filterDatesByAggregation = (dates, aggregationType) => {
  if (aggregationType === "day") return dates.slice(-1);
  if (aggregationType === "week") return dates.slice(-7);
  if (aggregationType === "month") return dates.slice(-30);
  return dates;
};


export {calculateAggregatedBrowsingTime, calculateAggregatedURLCount, getTotalBrowsingTime, getTotalURLsOpened, calculateWastedTime, calculateWorkingTime, getAggregationInterval, processDashboardData, retrieveYouTubeScrappingData };