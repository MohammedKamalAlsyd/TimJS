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

/////////////////////////////////// Helper Functions /////////////////////////////////////

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
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

// Helper function to get previous dates based on the aggregation type
function getRelevantDates(date, type) {
  const inputDate = new Date(date);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (type === "day") {
    return [formatDate(inputDate)];
  } else if (type === "week") {
    let weekDates = [];
    for (let i = 0; i < 7; i++) {
      let tempDate = new Date(inputDate);
      tempDate.setDate(tempDate.getDate() - i);
      weekDates.push(formatDate(tempDate));
    }
    return weekDates.reverse();
  } else if (type === "month") {
    let monthDates = [];
    let currentDate = new Date(inputDate);
    for (let i = 0; i < 30; i++) {
      monthDates.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() - 1);
    }
    return monthDates.reverse();
  }
  return [];
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
  if (relevantDates.length === 0) {
    return "No Data";
  }
  if (relevantDates.length === 1) {
    return relevantDates[0];
  } else {
    return `${relevantDates[0]} to ${relevantDates[relevantDates.length - 1]}`;
  }
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

// Process YouTube scraping data
const processRadialBarData = (scrappingData, relevantDates) => {
  const aggregatedData = [];
  relevantDates = relevantDates.filter((key) => key in scrappingData);

  if (relevantDates.length === 0) {
    return [];
  }

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

// Chi-square and normal distribution functions for A/B testing
function chiSquarePValue(chi2, df = 1) {
  if (df === 1) {
    const x = Math.sqrt(chi2);
    return 2 * (1 - normCdf(x));
  }
  return 1;
}

function normCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Compute pairwise A/B comparisons using chi-square test
const computePairComparisons = (links, nodes) => {
  const totalOut = {};
  nodes.forEach((node) => {
    totalOut[node.id] = 0;
  });
  links.forEach((link) => {
    if (link.source in totalOut) {
      totalOut[link.source] += link.value;
    }
  });
  const totalOutAll = Object.values(totalOut).reduce((a, b) => a + b, 0);

  const pairMap = {};
  links.forEach((link) => {
    const { source, target, value } = link;
    const key = [source, target].sort().join("||");
    if (!pairMap[key]) {
      const sorted = [source, target].sort();
      pairMap[key] = { nodeA: sorted[0], nodeB: sorted[1], a2b: 0, b2a: 0 };
    }
    if (link.source === pairMap[key].nodeA && link.target === pairMap[key].nodeB) {
      pairMap[key].a2b += value;
    } else if (link.source === pairMap[key].nodeB && link.target === pairMap[key].nodeA) {
      pairMap[key].b2a += value;
    }
  });

  const comparisons = [];
  for (const key in pairMap) {
    const pair = pairMap[key];
    const pairTotal = pair.a2b + pair.b2a;
    if (pairTotal === 0) continue;
    let direction;
    if (pair.a2b >= pair.b2a) {
      direction = { from: pair.nodeA, to: pair.nodeB };
    } else {
      direction = { from: pair.nodeB, to: pair.nodeA };
    }
    const user = direction.from;
    const target = direction.to;
    const edgeUserToTarget = links.find(
      (link) => link.source === user && link.target === target
    );
    const O1 = edgeUserToTarget ? edgeUserToTarget.value : 0;
    const totalUser = totalOut[user] || 0;
    const O2 = totalUser - O1;
    let O3 = 0;
    links.forEach((link) => {
      if (link.source !== user && link.target === target) {
        O3 += link.value;
      }
    });
    const totalNonUser = totalOutAll - totalUser;
    const O4 = totalNonUser - O3;
    const grandTotal = O1 + O2 + O3 + O4;
    const E1 = (totalUser * (O1 + O3)) / grandTotal;
    const E3 = (totalNonUser * (O1 + O3)) / grandTotal;
    const E2 = totalUser - E1;
    const E4 = totalNonUser - E3;
    const chi2 =
      ((O1 - E1) ** 2 / E1) +
      ((O2 - E2) ** 2 / E2) +
      ((O3 - E3) ** 2 / E3) +
      ((O4 - E4) ** 2 / E4);
    const pValue = chiSquarePValue(chi2, 1);
    let confidence = null;
    if (pValue < 0.01) confidence = "99%";
    else if (pValue < 0.05) confidence = "95%";
    else if (pValue < 0.10) confidence = "90%";
    else if (pValue < 0.15) confidence = "85%";
    comparisons.push({
      key,
      nodeA: pair.nodeA,
      nodeB: pair.nodeB,
      direction,
      O1,
      O2,
      O3,
      O4,
      totalUser,
      totalNonUser,
      E1,
      E2,
      E3,
      E4,
      chi2,
      pValue,
      confidence,
    });
  }
  return comparisons.sort((a, b) => a.pValue - b.pValue);
};

// Process graph and A/B testing data for PatternFinder
const processPatternData = (trackingData, relevantDates) => {
  if (!trackingData || !trackingData.sessions) {
    return {
      graphData: { nodes: [], links: [] },
      comparisonResults: [],
    };
  }

  // Aggregate node frequencies and edge transitions
  const nodeFrequencies = {};
  const edgeTransitions = {};
  const latestDate = relevantDates.sort().reverse()[0];
  const latestDailyData = trackingData.sessions[latestDate] || {};
  relevantDates.forEach((date) => {
    const dailyData = trackingData.sessions[date] || {};
    Object.keys(dailyData).forEach((website) => {
      nodeFrequencies[website] = (nodeFrequencies[website] || 0) + dailyData[website].time;

      const nextWebsites = dailyData[website].nextWebsites || {};
      Object.entries(nextWebsites).forEach(([target, count]) => {
        const key = `${website}→${target}`;
        edgeTransitions[key] = (edgeTransitions[key] || 0) + count;
      });
    });
  });

  // Prepare nodes and links with consistent property names
  const nodes = Object.keys(nodeFrequencies).map((id) => ({
    id,
    size: Math.round(nodeFrequencies[id]),
    icon: latestDailyData[id]?.icon || null,
  }));
  const links = Object.keys(edgeTransitions).map((key) => {
    const [source, target] = key.split("→");
    return { source, target, value: Math.round(edgeTransitions[key]) };
  });

  // Filter nodes and links by a 80% threshold
  const maxSize = Math.max(...nodes.map((node) => node.size || 0));
  const threshold = 0.2 * maxSize;
  const filteredNodes = nodes.filter((node) => node.size >= threshold);
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredLinks = links.filter(
    (link) => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
  );

  // Compute A/B testing results
  const comparisonResults = computePairComparisons(filteredLinks, filteredNodes);

  return {
    graphData: { nodes: filteredNodes, links: filteredLinks },
    comparisonResults,
  };
};

/////////////////////////////////// Pages Data Retrieval Functions /////////////////////////////////////

// Retrieve data for the Dashboard page
const retrieveDashboardData = async (aggregationType) => {
  const trackingData = await fetchFromStorage("trackingData");
  const relevantDates = getRelevantDates(getCurrentDate(), aggregationType);

  const totalBrowsingTime = trackingData?.total_browsing_time || 0;
  const totalURLsOpened = trackingData?.total_urls_opened || 0;
  const aggregatedBrowsingTime = calculateAggregatedBrowsingTime(
    trackingData.browsing,
    relevantDates
  );
  const aggregatedURLCount = calculateAggregatedURLCount(
    trackingData.urlsOpened,
    relevantDates
  );
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

  const processedData =
    Object.keys(interactionData.youtube).length !== 0
      ? processRadialBarData(interactionData.youtube, relevantDates)
      : [];
  const aggregationInterval = getAggregationInterval(relevantDates);
  return {
    processedData,
    aggregationInterval,
  };
};

// Retrieve data for the PatternFinder page
const retrievePatternData = async (aggregationType) => {
  const trackingData = await fetchFromStorage("trackingData");
  //console.log(trackingData);
//   const trackingData = {
//     "browsing": {
//         "2025-03-04": 180.0,
//         "2025-03-06": 200.0,
//         "2025-03-07": 250.0,
//         "2025-03-09": 60.0,
//         "2025-03-13": 140.0,
//         "2025-03-14": 160.0,
//         "2025-03-16": 180.0
//     },
//     "sessions": {
//         "2025-03-04": {
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 10,
//                     "stackoverflow.com": 8,
//                     "github.com": 5,
//                     "facebook.com": 4,
//                     "wikipedia.org": 3
//                 },
//                 "time": 15.0
//             },
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 7,
//                     "facebook.com": 5,
//                     "netflix.com": 4,
//                     "reddit.com": 3
//                 },
//                 "time": 40.0
//             },
//             "facebook.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/facebook.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 6,
//                     "instagram.com": 4,
//                     "twitter.com": 3,
//                     "google.com": 2
//                 },
//                 "time": 25.0
//             },
//             "stackoverflow.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/stackoverflow.com.ico",
//                 "nextWebsites": {
//                     "github.com": 6,
//                     "google.com": 5,
//                     "youtube.com": 3
//                 },
//                 "time": 30.0
//             },
//             "github.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/github.com.ico",
//                 "nextWebsites": {
//                     "stackoverflow.com": 4,
//                     "codesandbox.io": 3,
//                     "google.com": 2
//                 },
//                 "time": 20.0
//             },
//             "codesandbox.io": {
//                 "icon": "https://icons.duckduckgo.com/ip3/codesandbox.io.ico",
//                 "nextWebsites": {
//                     "github.com": 2,
//                     "stackoverflow.com": 1
//                 },
//                 "time": 10.0
//             },
//             "instagram.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/instagram.com.ico",
//                 "nextWebsites": {
//                     "facebook.com": 3,
//                     "twitter.com": 2
//                 },
//                 "time": 15.0
//             },
//             "twitter.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/twitter.com.ico",
//                 "nextWebsites": {
//                     "facebook.com": 2,
//                     "instagram.com": 1,
//                     "reddit.com": 1
//                 },
//                 "time": 10.0
//             },
//             "reddit.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/reddit.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 2,
//                     "google.com": 1
//                 },
//                 "time": 15.0
//             }
//         },
//         "2025-03-06": {
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 12,
//                     "facebook.com": 6,
//                     "reddit.com": 5,
//                     "quora.com": 4,
//                     "cnn.com": 3
//                 },
//                 "time": 20.0
//             },
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 8,
//                     "facebook.com": 6,
//                     "netflix.com": 5,
//                     "reddit.com": 4
//                 },
//                 "time": 45.0
//             },
//             "facebook.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/facebook.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 7,
//                     "instagram.com": 5,
//                     "twitter.com": 4,
//                     "linkedin.com": 2
//                 },
//                 "time": 30.0
//             },
//             "reddit.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/reddit.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 3,
//                     "google.com": 2,
//                     "quora.com": 1
//                 },
//                 "time": 20.0
//             },
//             "quora.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/quora.com.ico",
//                 "nextWebsites": {
//                     "google.com": 2,
//                     "reddit.com": 1,
//                     "youtube.com": 1
//                 },
//                 "time": 15.0
//             },
//             "cnn.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/cnn.com.ico",
//                 "nextWebsites": {
//                     "google.com": 2,
//                     "bbc.com": 1
//                 },
//                 "time": 10.0
//             },
//             "bbc.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/bbc.com.ico",
//                 "nextWebsites": {
//                     "cnn.com": 1,
//                     "google.com": 1
//                 },
//                 "time": 10.0
//             },
//             "netflix.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/netflix.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 3,
//                     "amazon.com": 2
//                 },
//                 "time": 30.0
//             }
//         },
//         "2025-03-07": {
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 10,
//                     "netflix.com": 8,
//                     "facebook.com": 6,
//                     "stackoverflow.com": 5
//                 },
//                 "time": 60.0
//             },
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 12,
//                     "stackoverflow.com": 7,
//                     "amazon.com": 4,
//                     "wikipedia.org": 3
//                 },
//                 "time": 25.0
//             },
//             "stackoverflow.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/stackoverflow.com.ico",
//                 "nextWebsites": {
//                     "github.com": 6,
//                     "google.com": 5,
//                     "youtube.com": 4
//                 },
//                 "time": 35.0
//             },
//             "netflix.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/netflix.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 5,
//                     "amazon.com": 3,
//                     "google.com": 2
//                 },
//                 "time": 50.0
//             },
//             "facebook.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/facebook.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 4,
//                     "instagram.com": 3,
//                     "twitter.com": 2
//                 },
//                 "time": 20.0
//             }
//         },
//         "2025-03-09": {
//             "adobe.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/adobe.com.ico",
//                 "nextWebsites": {
//                     "google.com": 2,
//                     "youtube.com": 1
//                 },
//                 "time": 15.0
//             },
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "adobe.com": 1,
//                     "youtube.com": 2,
//                     "wikipedia.org": 1
//                 },
//                 "time": 10.0
//             },
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 1,
//                     "netflix.com": 1
//                 },
//                 "time": 25.0
//             },
//             "wikipedia.org": {
//                 "icon": "https://icons.duckduckgo.com/ip3/wikipedia.org.ico",
//                 "nextWebsites": {
//                     "google.com": 1
//                 },
//                 "time": 10.0
//             }
//         },
//         "2025-03-13": {
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "github.com": 5,
//                     "youtube.com": 4,
//                     "mozilla.org": 3,
//                     "stackoverflow.com": 2
//                 },
//                 "time": 20.0
//             },
//             "github.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/github.com.ico",
//                 "nextWebsites": {
//                     "codesandbox.io": 3,
//                     "stackoverflow.com": 2,
//                     "google.com": 1
//                 },
//                 "time": 25.0
//             },
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 3,
//                     "netflix.com": 2,
//                     "facebook.com": 1
//                 },
//                 "time": 35.0
//             },
//             "mozilla.org": {
//                 "icon": "https://icons.duckduckgo.com/ip3/mozilla.org.ico",
//                 "nextWebsites": {
//                     "google.com": 2,
//                     "codesandbox.io": 1
//                 },
//                 "time": 15.0
//             },
//             "codesandbox.io": {
//                 "icon": "https://icons.duckduckgo.com/ip3/codesandbox.io.ico",
//                 "nextWebsites": {
//                     "github.com": 2,
//                     "google.com": 1
//                 },
//                 "time": 20.0
//             },
//             "stackoverflow.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/stackoverflow.com.ico",
//                 "nextWebsites": {
//                     "github.com": 1,
//                     "google.com": 1
//                 },
//                 "time": 25.0
//             }
//         },
//         "2025-03-14": {
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 6,
//                     "codesandbox.io": 4,
//                     "mozilla.org": 3,
//                     "amazon.com": 2
//                 },
//                 "time": 30.0
//             },
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 5,
//                     "netflix.com": 3,
//                     "facebook.com": 2
//                 },
//                 "time": 40.0
//             },
//             "codesandbox.io": {
//                 "icon": "https://icons.duckduckgo.com/ip3/codesandbox.io.ico",
//                 "nextWebsites": {
//                     "github.com": 3,
//                     "mozilla.org": 2,
//                     "google.com": 1
//                 },
//                 "time": 25.0
//             },
//             "mozilla.org": {
//                 "icon": "https://icons.duckduckgo.com/ip3/mozilla.org.ico",
//                 "nextWebsites": {
//                     "google.com": 2,
//                     "codesandbox.io": 1
//                 },
//                 "time": 20.0
//             },
//             "netflix.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/netflix.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 2,
//                     "amazon.com": 1
//                 },
//                 "time": 35.0
//             },
//             "amazon.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/amazon.com.ico",
//                 "nextWebsites": {
//                     "google.com": 1,
//                     "youtube.com": 1
//                 },
//                 "time": 10.0
//             }
//         },
//         "2025-03-16": {
//             "google.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/google.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 8,
//                     "codesandbox.io": 5,
//                     "mozilla.org": 4,
//                     "linkedin.com": 3
//                 },
//                 "time": 25.0
//             },
//             "youtube.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/youtube.com.ico",
//                 "nextWebsites": {
//                     "google.com": 6,
//                     "netflix.com": 4,
//                     "facebook.com": 3
//                 },
//                 "time": 45.0
//             },
//             "codesandbox.io": {
//                 "icon": "https://icons.duckduckgo.com/ip3/codesandbox.io.ico",
//                 "nextWebsites": {
//                     "github.com": 3,
//                     "google.com": 2,
//                     "mozilla.org": 1
//                 },
//                 "time": 30.0
//             },
//             "mozilla.org": {
//                 "icon": "https://icons.duckduckgo.com/ip3/mozilla.org.ico",
//                 "nextWebsites": {
//                     "google.com": 3,
//                     "codesandbox.io": 2
//                 },
//                 "time": 20.0
//             },
//             "linkedin.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/linkedin.com.ico",
//                 "nextWebsites": {
//                     "google.com": 2,
//                     "twitter.com": 1
//                 },
//                 "time": 15.0
//             },
//             "netflix.com": {
//                 "icon": "https://icons.duckduckgo.com/ip3/netflix.com.ico",
//                 "nextWebsites": {
//                     "youtube.com": 3,
//                     "google.com": 1
//                 },
//                 "time": 40.0
//             }
//         }
//     },
//     "total_browsing_time": 1170.0,
//     "total_urls_opened": 2500,
//     "urlsOpened": {
//         "2025-03-04": 400,
//         "2025-03-06": 450,
//         "2025-03-07": 500,
//         "2025-03-09": 150,
//         "2025-03-13": 350,
//         "2025-03-14": 400,
//         "2025-03-16": 450
//     }
// }
  const relevantDates = getRelevantDates(getCurrentDate(), aggregationType);
  return processPatternData(trackingData, relevantDates);
};

export { retrieveDashboardData, retrieveInteractionData, retrievePatternData };