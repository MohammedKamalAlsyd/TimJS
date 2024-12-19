import React, { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import { Box, HStack, VStack, Text, Spacer } from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import WebClassification from "../utils/Web Classification.json";

const TimeTracker = () => {
  const [chartData, setChartData] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState(null); // To filter based on chart click
  const [websiteData, setWebsiteData] = useState([]); // To store the website usage details
  const [wastedTime, setWastedTime] = useState(0); // Wasted time in minutes
  const [workingTime, setWorkingTime] = useState(0); // Working time in minutes
  const [activeCategory, setActiveCategory] = useState(null); // State to track the currently focused category
  const [hoveredCategory, setHoveredCategory] = useState(null); // Track hovered bar

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

  const processData = (data) => {
    const categoryMap = {};
    const websiteDetails = [];
    let totalWastedTime = 0;
    let totalWorkingTime = 0;

    Object.keys(data).forEach((website) => {
      const siteInfo = data[website]; // Get the site information
      const timeSpent = siteInfo.time; // Time spent on the website
      const category = WebClassification[website]?.Category || "Other";
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

    const formattedChartData = Object.keys(categoryMap).map((category) => ({
      name: category,
      hours: (categoryMap[category] / 60).toFixed(2), // Convert minutes to hours
    }));

    setChartData(formattedChartData);
    setWebsiteData(websiteDetails);
    setWastedTime(totalWastedTime);
    setWorkingTime(totalWorkingTime);
  };

  useEffect(() => {
    chrome.storage.local.get("websiteData", (result) => {
      const websiteData = result.websiteData || {};
      const dates = Object.keys(websiteData);
      const latestDate =
        dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;

      if (latestDate) {
        const todayData = websiteData[latestDate];
        processData(todayData);
      }
    });
  }, []);

  const handleBarClick = (data) => {
    if (data && data.name) {
      if (activeCategory === data.name) {
        setActiveCategory(null); // Clear active category
        setFilteredCategory(null);
      } else {
        setActiveCategory(data.name); // Set new active category
        setFilteredCategory(data.name);
      }
    }
  };

  const filteredWebsites = filteredCategory
    ? websiteData.filter((site) => site.category === filteredCategory)
    : websiteData;

  const getBarColor = (category) => {
    console.log("hj")
    if (category === activeCategory || category === hoveredCategory) {
      return "#555555"; // Active or hovered bar color
    }
    return "#C4C4C4"; // Default bar color
  };

  const formatTime = (minutes) => {
    if (minutes < 1) return "Less than 1 minute";
    const h = Math.floor(minutes / 60);
    const m = (minutes % 60).toFixed(0);
    return `${h} h ${m} m`;
  };

  return (
    <Box className="dashboard_container">
      <Box className="current_dashboard">
        <VStack alignItems="left" className="current_dashboard_content">
          <h1>Current Dashboard</h1>

          <Box className="number_cell_grid">
            <Box className="number_cell wasted_time">
              <VStack alignItems="left">
                <Text className="label">Wasted Time</Text>
                <Spacer />
                <Text className="red-text">{formatTime(wastedTime)}</Text>
              </VStack>
            </Box>

            <Box className="number_cell working_time">
              <VStack alignItems="left">
                <Text className="label">Working Time</Text>
                <Spacer />
                <Text className="green-text">{formatTime(workingTime)}</Text>
              </VStack>
            </Box>

            <Box className="bar_chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 10, bottom: 5 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#999" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => Math.round(value * 10) / 10}
                    tick={{ fontSize: 10, fill: "#999" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    label={{
                      value: "Hours",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 10,
                      fill: "#999",
                      offset: "-6",
                    }}
                  />
                  <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                  <Bar
                    dataKey="hours"
                    onMouseEnter={(data) => setHoveredCategory(data.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(data) => handleBarClick(data)}
                    cursor="pointer"
                    style={{ transition: "fill 0.2s ease-in-out" }}
                  >
                    {/* Customize the fill based on data */}
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={() => getBarColor(entry.name)} // Example condition: random fill color
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </VStack>
      </Box>

      <Box className="usage_list">
        <h1>Usage Summary</h1>
        <Box className="usage_list_content">
          <VStack alignItems="left" spacing={2}>
            {filteredWebsites.length > 0 ? (
              filteredWebsites
                .sort((a, b) => b.time - a.time)
                .map((site) => (
                  <HStack key={site.name} className="usage_list_item">
                    <img
                      src={site.icon}
                      alt={site.name}
                      className="site_icon"
                    />
                    <VStack alignItems="left" flexGrow={1}>
                      <Text fontSize="md">{site.name}</Text>
                      <Text fontSize="sm" className="site_category">
                        Active: {formatTime(site.time)} | Category:{" "}
                        {site.category}
                      </Text>
                    </VStack>
                    <Text fontSize="sm" className="site_percentage">
                      {site.time > 0
                        ? (
                            (site.time /
                              websiteData.reduce(
                                (acc, site) => acc + site.time,
                                0
                              )) *
                            100
                          ).toFixed(1) + "%"
                        : "0%"}
                    </Text>
                    <Box
                      className="site_bar"
                      style={{
                        width: `${
                          (site.time /
                            websiteData.reduce(
                              (acc, site) => acc + site.time,
                              0
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </HStack>
                ))
            ) : (
              <Text>No websites to display.</Text>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default TimeTracker;
