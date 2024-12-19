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

const processBarChartData = (websiteData, aggregationType) => {
  console.log(aggregationType)
  const categoryMap = {};
  const websiteDetails = [];
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

      categoryMap[category] = (categoryMap[category] || 0) + timeSpent;

      if (WASTED_CATEGORIES.includes(category)) {
        totalWastedTime += timeSpent;
      } else if (WORKING_CATEGORIES.includes(category)) {
        totalWorkingTime += timeSpent;
      }

      websiteDetails.push({
        name: website,
        time: timeSpent,
        category,
        icon: siteInfo.icon,
      });
    });
  });

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

export default processBarChartData;
