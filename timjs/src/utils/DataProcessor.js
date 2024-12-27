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

const calculateBrowsingTimeByAggregation = (browsingData, aggregationType) => {
  const dates = Object.keys(browsingData).sort();
  let relevantDates = [];

  if (aggregationType === "day") {
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    relevantDates = latestDate ? [latestDate] : [];
  } else if (aggregationType === "week") {
    relevantDates = dates.slice(-7);
  } else if (aggregationType === "month") {
    relevantDates = dates.slice(-30);
  }

  const totalBrowsingTime = Math.round(
    relevantDates.reduce((total, date) => total + (browsingData[date] || 0), 0)
  );

  return totalBrowsingTime;
};

const processDashboardData = async (aggregationType) => {
  const trackingData = await fetchFromStorage("trackingData");
  if (!trackingData) {
    return {
      chartData: [],
      websiteDetails: [],
      wastedTime: 0,
      workingTime: 0,
      totalTime: 0,
      aggBrowsing: 0,
      aggregationInterval: "",
    };
  }

  const categoryMap = {};
  const websiteDetailsMap = {};
  let totalWastedTime = 0;
  let totalWorkingTime = 0;

  const dates = Object.keys(trackingData.sessions).sort();
  let interval = "";
  let relevantDates = [];

  if (aggregationType === "day") {
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    relevantDates = latestDate ? [latestDate] : [];
    interval = latestDate || "No Data";
  } else if (aggregationType === "week" || aggregationType === "month") {
    relevantDates = aggregationType === "week" ? dates.slice(-7) : dates.slice(-30);
    interval =
      relevantDates.length > 0
        ? `${relevantDates[0]} to ${relevantDates[relevantDates.length - 1]}`
        : "No Data";
  }

  relevantDates.forEach((date) => {
    const dailyData = trackingData.sessions[date] || {};
    Object.keys(dailyData).forEach((website) => {
      const siteInfo = dailyData[website];
      const timeSpent = siteInfo.time;
      const category = WebClassification[website]?.Category || "Other";

      categoryMap[category] = (categoryMap[category] || 0) + timeSpent;

      if (WASTED_CATEGORIES.includes(category)) {
        totalWastedTime += timeSpent;
      } else if (WORKING_CATEGORIES.includes(category)) {
        totalWorkingTime += timeSpent;
      }

      if (!websiteDetailsMap[website]) {
        websiteDetailsMap[website] = {
          name: website,
          time: timeSpent,
          category,
          icon: siteInfo.icon,
        };
      } else {
        websiteDetailsMap[website].time += timeSpent;
      }
    });
  });

  const totalBrowsingTime = Object.values(categoryMap).reduce((acc, val) => acc + val, 0);
  const aggBrowsing = calculateBrowsingTimeByAggregation(trackingData.browsing, aggregationType);

  const formattedChartData = Object.keys(categoryMap).map((category) => ({
    name: category,
    hours: (categoryMap[category] / 60).toFixed(2),
  }));

  return {
    chartData: formattedChartData,
    websiteDetails: Object.values(websiteDetailsMap),
    wastedTime: totalWastedTime,
    workingTime: totalWorkingTime,
    totalTime: totalBrowsingTime,
    aggBrowsing,
    aggregationInterval: interval,
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
      // Ensure that 'Video' and 'Shorts' values are properly initialized
      const existingGenre = aggregatedData.find((item) => item.name === genre);

      if (existingGenre) {
        existingGenre[genreData.type] += genreData.time; // Update existing genre's time
      } else {
        aggregatedData.push({
          name: genre,
          Video: genreData.type === "video" ? genreData.time : 0,
          Shorts: genreData.type === "shorts" ? genreData.time : 0,
        });
      }
    });
  });


  // Ensure each genre has the necessary data fields (Video and Shorts)
  return aggregatedData.map((genreData) => ({
    name: genreData.name,
    Video: genreData.Video || 0, // Default to 0 if not available
    Shorts: genreData.Shorts || 0, // Default to 0 if not available
  }));
};

const filterDatesByAggregation = (dates, aggregationType) => {
  if (aggregationType === "day") return dates.slice(-1);
  if (aggregationType === "week") return dates.slice(-7);
  if (aggregationType === "month") return dates.slice(-30);
  return dates;
};


export { processDashboardData, retrieveYouTubeScrappingData };
