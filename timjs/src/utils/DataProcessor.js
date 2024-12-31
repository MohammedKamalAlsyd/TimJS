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

///////////////////////////////////Helper Functions/////////////////////////////////////
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


// Helper function to get today's date in "YYYY-MM-DD" format
function getCurrentDate() {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().split("T")[0];
}


// Helper function to get previous dates based on the aggregation type
function getRelevantDates(date, type) {
  // Convert the date string to a Date object
  const inputDate = new Date(date);
  
  // Helper function to format date as 'YYYY-MM-DD'
  const formatDate = (d) => {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  if (type === "day") {
      // For day, return the given date as an array
      return [formatDate(inputDate)];
  }
  
  if (type === "week") {
      // For week, return 7 dates including the current day
      let weekDates = [];
      for (let i = 0; i < 7; i++) {
          let tempDate = new Date(inputDate);
          tempDate.setDate(tempDate.getDate() - i); // Subtract i days from the input date
          weekDates.push(formatDate(tempDate));
      }
      return weekDates.reverse(); // To keep the order from earliest to latest
  }
  
  if (type === "month") {
    // For month, return the last 30 days including today
    let monthDates = [];
    let currentDate = new Date(inputDate);
    
    // Loop through the last 30 days starting from the input date
    for (let i = 0; i < 30; i++) {
      monthDates.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() - 1); // Subtract 1 day to get the previous date
    }
    
    return monthDates.reverse(); // To keep the order from earliest to latest
  }
  
  return []; // Return an empty array for invalid type
}


// General aggregation function
const aggregateData = (data, relevantDates) => {
  const aggregatedValue = relevantDates.reduce((total, date) => total + (data[date] || 0), 0);
  return { aggregatedValue, relevantDates };
};


// Calculate aggregated browsing time
const calculateAggregatedBrowsingTime = (browsingData, relevantDates) => {
  const { aggregatedValue } = aggregateData(browsingData, relevantDates);
  return Math.round(aggregatedValue);
};


// Calculate aggregated URL count
const calculateAggregatedURLCount = (urlData, relevantDates) => {
  const { aggregatedValue } = aggregateData(urlData, relevantDates);
  return aggregatedValue;
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
const getAggregationInterval = (relevantDates) => {
  // If relevantDates is empty, return "No Data"
  if (relevantDates.length === 0) {
    return "No Data";
  }

  // Aggregation logic based on the length of the relevantDates array
  if (relevantDates.length === 1) {return relevantDates[0];}
  else {return `${relevantDates[0]} to ${relevantDates[relevantDates.length - 1]}`;}
};


// Process dashboard data
const processDashboardData = async (trackingData, relevantDates) => {
  if (!trackingData) {
    return {
      chartData: [],
      websiteDetails: [],
    };
  }

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


// Process YouTube scrapping data
const processRadialBarData = (scrappingData, relevantDates) => {
  const aggregatedData = [];
  relevantDates = relevantDates.filter(key => key in scrappingData);
  
  if (relevantDates.length === 0) {return [];}

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

///////////////////////////////////Pages Data Retreival Functions/////////////////////////////////////

// Retrieve data for the Dashboard page
const retrieveDashboardData = async (aggregationType) => {
  const trackingData = await fetchFromStorage("trackingData");
  const relevantDates = getRelevantDates(getCurrentDate(), aggregationType);

  const totalBrowsingTime = trackingData?.total_browsing_time || 0;;
  const totalURLsOpened = trackingData?.total_urls_opened || 0;
  const aggregatedBrowsingTime = calculateAggregatedBrowsingTime(trackingData.browsing, relevantDates);
  const aggregatedURLCount = calculateAggregatedURLCount(trackingData.urlsOpened, relevantDates);
  const wastedTime = calculateWastedTime(trackingData, relevantDates);
  const workingTime = calculateWorkingTime(trackingData, relevantDates);
  const aggregationInterval = getAggregationInterval(relevantDates);
  const dashboardData = await processDashboardData(trackingData, relevantDates);

  return {
    totalBrowsingTime,
    totalURLsOpened,
    aggregatedBrowsingTime,
    aggregatedURLCount,
    wastedTime,
    workingTime,
    aggregationInterval,
    ...dashboardData,
  };
};


// Retrieve data for the Interaction Analysis page
const retrieveInteractionData = async (aggregationType) => {
  const interactionData = await fetchFromStorage("interactionData");
  const relevantDates = getRelevantDates(getCurrentDate(), aggregationType);

  const processedData = Object.keys(interactionData.youtube).length !== 0? processRadialBarData(interactionData.youtube, relevantDates): [];
  const aggregationInterval = getAggregationInterval(relevantDates);
  return {
    processedData,
    aggregationInterval
  };
};



export {retrieveDashboardData, retrieveInteractionData };