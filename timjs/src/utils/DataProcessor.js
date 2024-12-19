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


/**
 * Function to calculate browsing time based on aggregation type (day/week/month).
 * @param {Object} websiteData - The tracking data containing browsing times.
 * @param {string} aggregationType - "day", "week", or "month".
 * @returns {Object} Object containing total browsing time and the interval string.
 */
// Function to calculate total browsing time by aggregation type
const calculateBrowsingTimeByAggregation = (browsingData, aggregationType) => {
  const dates = Object.keys(browsingData).sort(); // Sort dates for chronological order
  let relevantDates = [];

  if (aggregationType === "day") {
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    relevantDates = latestDate ? [latestDate] : [];
  } else if (aggregationType === "week") {
    relevantDates = dates.slice(-7); // Last 7 days
  } else if (aggregationType === "month") {
    relevantDates = dates.slice(-30); // Last 30 days
  }

  // Calculate total browsing time as an integer
  const totalBrowsingTime = Math.round(relevantDates.reduce((total, date) => {
    return total + (browsingData[date] || 0);
  }, 0));

  return totalBrowsingTime;
};


// Function to get the aggregation interval as a string
const getAggregationInterval = (dates, aggregationType) => {
  dates = dates.sort(); // Sort dates in chronological order
  let interval = "";
  if (aggregationType === "day") {
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : "No Data";
    interval = latestDate;
  } else if (aggregationType === "week") {
    interval = dates.length > 0
      ? `${dates[0]} to ${dates[dates.length - 1]}`
      : "No Data";
  } else if (aggregationType === "month") {
    interval = dates.length > 0
      ? `${dates[0]} to ${dates[dates.length - 1]}`
      : "No Data";
  }
  return interval;
};

/**
 * Main function to process bar chart data for browsing.
 * @param {Object} websiteData - The tracking data containing website sessions.
 * @param {string} aggregationType - "day", "week", or "month".
 * @returns {Object} Processed data for bar chart and details.
 */
const processBarChartData = (websiteData, aggregationType) => {
  const categoryMap = {};
  const websiteDetailsMap = {}; // Map to store unique websites
  let totalWastedTime = 0;
  let totalWorkingTime = 0;

  const dates = Object.keys(websiteData);
  let interval = "";
  let relevantDates = [];

  if (aggregationType === "day") {
    const latestDate = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;
    relevantDates = latestDate ? [latestDate] : [];
    interval = latestDate;
  } else if (aggregationType === "week" || aggregationType === "month") {
    const sortedDates = dates.sort();
    relevantDates = sortedDates.slice(-7); // Last 7 days (week) or similar logic for month
    interval = `${relevantDates[0]} to ${relevantDates[relevantDates.length - 1]}`;
  }

  relevantDates.forEach((date) => {
    const dailyData = websiteData[date] || {};
    Object.keys(dailyData).forEach((website) => {
      const siteInfo = dailyData[website];
      const timeSpent = siteInfo.time;
      const category = WebClassification[website]?.Category || "Other";

      // Update category map
      categoryMap[category] = (categoryMap[category] || 0) + timeSpent;

      // Update total wasted or working time
      if (WASTED_CATEGORIES.includes(category)) {
        totalWastedTime += timeSpent;
      } else if (WORKING_CATEGORIES.includes(category)) {
        totalWorkingTime += timeSpent;
      }

      // Update website details map to ensure unique websites
      if (!websiteDetailsMap[website]) {
        websiteDetailsMap[website] = {
          name: website,
          time: timeSpent,
          category,
          icon: siteInfo.icon,
        };
      } else {
        // Concatenate the time if the website already exists
        websiteDetailsMap[website].time += timeSpent;
      }
    });
  });

  // Convert websiteDetailsMap to an array
  const websiteDetails = Object.values(websiteDetailsMap);

  // Format chart data
  const formattedChartData = Object.keys(categoryMap).map((category) => ({
    name: category,
    hours: (categoryMap[category] / 60).toFixed(2),
  }));

  return {
    chartData: formattedChartData,
    websiteDetails,
    wastedTime: totalWastedTime,
    workingTime: totalWorkingTime,
    interval,
  };
};

export {  
  calculateBrowsingTimeByAggregation, 
  processBarChartData 
};
