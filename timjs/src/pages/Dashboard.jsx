// TimJS/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Box, HStack, VStack, Text, Spacer } from "@chakra-ui/react";
import { BiWorld } from "react-icons/bi";
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
import InfoTooltip from "../components/InfoTooltip";
import { retrieveDashboardData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";

const TimeTracker = () => {
  const { aggregationType } = useGlobalContext();
  const [chartData, setChartData] = useState([]);
  const [websiteDetails, setWebsiteDetails] = useState([]);
  const [wastedTime, setWastedTime] = useState(0);
  const [workingTime, setWorkingTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [aggBrowsing, setAggBrowsing] = useState(0);
  const [totalURLs, setTotalURLs] = useState(0);
  const [aggURLs, setAggURLs] = useState(0);
  const [aggregationInterval, setAggregationInterval] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Main container: 2 columns (65%/35%), 2 rows of equal height
  const containerStyle = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "65% 35%",
    gridTemplateRows: "1fr 1fr", // Equal height rows
    gridGap: "15px",
    width: "100%",
    height: "88vh",
    padding: "10px 25px",
    backgroundColor: "#f7f9fc",
    borderRadius: "8px",
  };

  // Dashboard (top-left): occupies row 1 / col 1
  const dashboardStyle = {
    gridColumn: "1",
    gridRow: "1",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
  };

  // Usage Summary (bottom-left): occupies row 2 / col 1
  const usageListStyle = {
    gridColumn: "1",
    gridRow: "2",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "15px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // prevent content overflow
  };

  // Browsing Summary (top-right): occupies row 1 / col 2
  const browsingSummaryStyle = {
    gridColumn: "2",
    gridRow: "1",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "5%",
    boxSizing: "border-box",
  };

  // Sync Info (bottom-right): occupies row 2 / col 2
  // Removed height: "100%" and added alignSelf: "start" so that it fits its content.
  const syncInfoStyle = {
    gridColumn: "2",
    gridRow: "2",
    backgroundColor: "#000",
    padding: "20px",
    position: "relative",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    alignSelf: "start",
    height: "100%",
  };

  // Sub-grid for the top section of Dashboard (Wasted/Working time + Bar Chart)
  const numberCellGridStyle = {
    display: "grid",
    gridTemplateColumns: "50% 50%",
    gridTemplateRows: "30% 70%",
    gridGap: "15px",
    marginTop: "15px",
    flex: "1", // Fill available space
  };

  const numberCellStyle = {
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const wastedTimeStyle = {
    gridArea: "1 / 1 / 2 / 2",
  };

  const workingTimeStyle = {
    gridArea: "1 / 2 / 2 / 3",
  };

  const barChartStyle = {
    gridArea: "2 / 1 / 3 / 3",
    padding: "15px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    height: "100%",
  };

  // Usage list content: allow scrolling for overflow content
  const usageListContentStyle = {
    flex: "1",
    overflowY: "auto",
  };

  const syncButtonStyle = {
    backgroundColor: "#F0F0F0",
    border: "1px solid #D0D0D0",
    padding: "10px 20px",
    borderRadius: "4px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    cursor: "not-allowed",
    transition: "background-color 0.3s",
    position: "absolute",
    bottom: "30px",
    right: "25px",
  };

  const roundedBoxStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "15px",
    marginBottom: "10px",
  };

  const usageListItemStyle = {
    padding: "15px",
    borderBottom: "1px solid #eee",
    width: "100%",
    boxSizing: "border-box",
    transition: "background-color 0.3s",
  };

  const siteIconStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  };

  const siteCategoryStyle = {
    fontSize: "0.875rem",
    color: "gray",
  };

  const sitePercentageStyle = {
    fontSize: "0.875rem",
    color: "gray",
  };

  const siteBarStyle = {
    borderRadius: "5px",
    height: "10px",
    backgroundColor: "teal",
    marginLeft: "10px",
    transition: "width 0.3s",
  };

  // Fetch data from the API
  const fetchData = async () => {
    const results = await retrieveDashboardData(aggregationType);
    if (results) {
      setChartData(results.chartData || []);
      setWebsiteDetails(results.websiteDetails || []);
      setWastedTime(results.wastedTime);
      setWorkingTime(results.workingTime);
      setTotalTime(results.totalBrowsingTime);
      setAggBrowsing(results.aggregatedBrowsingTime);
      setTotalURLs(results.totalURLsOpened);
      setAggURLs(results.aggregatedURLCount);
      setAggregationInterval(results.aggregationInterval);
    }
  };

  useEffect(() => {
    fetchData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [aggregationType]);

  // Format total minutes into days, hours, and minutes
  const formatTime = (totalMinutes) => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = Math.round(totalMinutes % 60);
    let formattedTime = "";
    if (days > 0) formattedTime += `${days} day${days > 1 ? "s" : ""}, `;
    if (hours > 0) formattedTime += `${hours} hour${hours > 1 ? "s" : ""}, `;
    formattedTime += `${minutes} minute${minutes > 1 ? "s" : ""}`;
    return formattedTime;
  };

  // Format large numbers to K/M values
  const formatNumber = (number) => {
    if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
    else if (number >= 1000) return (number / 1000).toFixed(1) + "K";
    else return number.toString();
  };

  // Toggle active category on bar click
  const handleBarClick = (data) => {
    if (data && data.name) {
      setActiveCategory((prevCategory) =>
        prevCategory === data.name ? null : data.name
      );
    }
  };

  // Fallback for site icons
  const handleImageError = (e) => {
    e.target.style.display = "none";
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = "block";
    }
  };

  // Filter websites based on active category
  const filteredWebsites = activeCategory
    ? websiteDetails.filter((site) => site.category === activeCategory)
    : websiteDetails;

  // Determine bar color based on active or hovered category
  const getBarColor = (category) => {
    if (category === activeCategory || category === hoveredCategory) {
      return "#555555";
    }
    return "#C4C4C4";
  };

  // Capitalize the first word (for aggregationType)
  const capitalizeFirstWord = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Box style={containerStyle}>
      {/* Dashboard (top-left) */}
      <Box style={dashboardStyle}>
        <VStack align="left">
          <h1>
            Dashboard {aggregationInterval && `(${aggregationInterval})`}
          </h1>
          <Box style={numberCellGridStyle}>
            {/* Wasted Time */}
            <Box style={{ ...numberCellStyle, ...wastedTimeStyle }}>
              <VStack align="left">
                <HStack>
                  <h2>Wasted Time</h2>
                  <Spacer />
                  <InfoTooltip message="Wasted Time is the total time spent on websites like social media, shopping, entertainment, games, lifestyle, and travel." />
                </HStack>
                <Text color="red.500">{formatTime(wastedTime)}</Text>
              </VStack>
            </Box>
            {/* Working Time */}
            <Box style={{ ...numberCellStyle, ...workingTimeStyle }}>
              <VStack align="left">
                <HStack>
                  <h2>Working Time</h2>
                  <Spacer />
                  <InfoTooltip message="Working Time is the total time spent on websites related to technology, tools, business, finance, health, careers, education, and news." />
                </HStack>
                <Text color="green.500">{formatTime(workingTime)}</Text>
              </VStack>
            </Box>
            {/* Bar Chart */}
            <Box style={barChartStyle}>
              <ResponsiveContainer initialDimension={{ width: 200, height: 200 }}>
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
                    radius={[30, 30, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </VStack>
      </Box>

      {/* Browsing Summary (top-right) */}
      <Box style={browsingSummaryStyle}>
        <h2>Browsing Time</h2>
        <VStack align="left">
          <Box style={roundedBoxStyle}>
            <h3>Total Browsing Time:</h3>
            <h3>{formatTime(totalTime)}</h3>
          </Box>
          <Box style={roundedBoxStyle}>
            <h3>
              Total Browsing in This {capitalizeFirstWord(aggregationType)}:
            </h3>
            <h3>{formatTime(aggBrowsing)}</h3>
          </Box>
          <Box style={roundedBoxStyle}>
            <h3>Total URLs Opened:</h3>
            <h3>{formatNumber(totalURLs)}</h3>
          </Box>
          <Box style={roundedBoxStyle}>
            <h3>
              Total URLs in This {capitalizeFirstWord(aggregationType)}:
            </h3>
            <h3>{formatNumber(aggURLs)}</h3>
          </Box>
        </VStack>
      </Box>

      {/* Usage Summary (bottom-left) */}
      <Box style={usageListStyle}>
        <h1>Usage Summary</h1>
        <Box style={usageListContentStyle}>
          <VStack align="left" spacing={2}>
            {filteredWebsites.length > 0 ? (
              filteredWebsites
                .sort((a, b) => b.time - a.time)
                .map((site) => {
                  const totalAllSites = websiteDetails.reduce(
                    (acc, s) => acc + s.time,
                    0
                  );
                  const sitePercentage =
                    totalAllSites > 0
                      ? ((site.time / totalAllSites) * 100).toFixed(1) + "%"
                      : "0%";

                  return (
                    <HStack
                      key={site.name}
                      style={usageListItemStyle}
                      alignItems="flex-start"
                    >
                      {/* Icon (or fallback) */}
                      <img
                        src={site.icon}
                        alt={site.name}
                        style={siteIconStyle}
                        onError={handleImageError}
                      />
                      <BiWorld size={24} style={{ display: "none" }} />
                      {/* Text + progress bar */}
                      <VStack align="left" flex="1" spacing={1}>
                        <Text fontSize="md">{site.name}</Text>
                        <Text fontSize="sm" style={siteCategoryStyle}>
                          Active: {formatTime(site.time)} | Category: {site.category}
                        </Text>
                        <HStack w="100%" justifyContent="space-between">
                          <Text fontSize="sm" style={sitePercentageStyle}>
                            {sitePercentage}
                          </Text>
                          <Box
                            style={{
                              ...siteBarStyle,
                              width: `${(site.time / totalAllSites) * 100}%`,
                            }}
                          />
                        </HStack>
                      </VStack>
                    </HStack>
                  );
                })
            ) : (
              <Text>No websites to display.</Text>
            )}
          </VStack>
        </Box>
      </Box>

      {/* Sync Info (bottom-right) */}
      <Box style={syncInfoStyle}>
        <h1 style={{ color: "floralwhite", fontWeight: 200 }}>
          Account Sync Information
        </h1>
        <h2
          style={{
            color: "floralwhite",
            fontWeight: 200,
            padding: "15px 0px",
          }}
        >
          Feature Not Implemented Yet
        </h2>
        <button style={syncButtonStyle} disabled={true}>
          Sync
        </button>
      </Box>
    </Box>
  );
};

export default TimeTracker;
