import { globalAggregationType } from '../components/Header'; // For current comparison type
import WebClassification from './Web Classification.json';

// Function to process data based on comparison type
export const processChartData = (data, comparisonType) => {
  const today = new Date();
  const currentDay = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const oneDayAgo = getPreviousDate(today, 1);

  // Daily Data Processing
  if (comparisonType === 'daily') {
    const currentData = data[currentDay] || {};
    const previousData = data[oneDayAgo] || null;

    if (!previousData) return { chartData: formatChartData(currentData), showCheckbox: false };

    const comparedData = compareData(currentData, previousData);
    return { chartData: comparedData, showCheckbox: true };
  }

  // Weekly/Monthly Data Processing
  const rangeDays = comparisonType === 'weekly' ? 14 : 30;
  const aggregatedData = aggregateDateRange(data, today, rangeDays);
  return { chartData: aggregatedData, showCheckbox: true };
};

// Function to compare current and previous data
const compareData = (current, previous) => {
  const comparisonResult = [];
  Object.keys(current).forEach((website) => {
    const currentTime = current[website]?.time || 0;
    const previousTime = previous[website]?.time || 0;

    comparisonResult.push({
      name: website,
      current: currentTime / 60, // Current time in hours
      previous: previousTime / 60, // Previous time in hours
      difference: Math.abs(currentTime - previousTime) / 60, // Absolute difference in hours
    });
  });
  return comparisonResult;
};

// Helper: Aggregate data for a date range
const aggregateDateRange = (data, endDate, days) => {
  const result = {};
  for (let i = 0; i < days; i++) {
    const date = getPreviousDate(endDate, i);
    const dayData = data[date] || {};

    Object.keys(dayData).forEach((website) => {
      result[website] = (result[website] || 0) + dayData[website].time;
    });
  }
  return formatChartData(result);
};

// Helper: Format data for the chart
const formatChartData = (data) => {
  return Object.keys(data).map((key) => ({
    name: key,
    hours: (data[key] / 60).toFixed(2), // Convert minutes to hours
  }));
};

// Helper: Get previous date by subtracting days
const getPreviousDate = (currentDate, daysAgo) => {
  const date = new Date(currentDate);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};



const WASTED_CATEGORIES = [
  'Social Media',
  'Shopping',
  'Arts & Entertainment',
  'Games',
  'Life Style & Hobbies',
];

const WORKING_CATEGORIES = [
  'Technology',
  'Tools',
  'Business & Consumer Services',
  'Finance',
  'Health & Food',
  'Jobs & Careers',
  'Science & Education',
  'News & Sport',
  'Travel',
];

export const processWebsiteData = (data) => {
  const categoryMap = {};
  const websiteDetails = [];
  let totalWastedTime = 0;
  let totalWorkingTime = 0;

  // Process data and categorize websites
  Object.keys(data).forEach((website) => {
    const siteInfo = data[website]; // Get the site information
    const timeSpent = siteInfo.time; // Time spent on the website
    const category = WebClassification[website]?.Category || 'Other';
    const icon = siteInfo.icon; // Extracting icon directly from siteInfo

    // Aggregate time by category
    categoryMap[category] = (categoryMap[category] || 0) + timeSpent;

    // Classify as wasted or working time
    if (WASTED_CATEGORIES.includes(category)) {
      totalWastedTime += timeSpent;
    } else if (WORKING_CATEGORIES.includes(category)) {
      totalWorkingTime += timeSpent;
    }

    // Create details for the usage list
    websiteDetails.push({
      name: website,
      time: timeSpent,
      category,
      icon,
    });
  });

  // Convert category data for chart
  const formattedChartData = Object.keys(categoryMap).map((category) => ({
    name: category,
    hours: (categoryMap[category] / 60).toFixed(2), // Convert minutes to hours
  }));

  return {
    chartData: formattedChartData,
    websiteDetails,
    wastedTime: totalWastedTime,
    workingTime: totalWorkingTime,
  };
};
