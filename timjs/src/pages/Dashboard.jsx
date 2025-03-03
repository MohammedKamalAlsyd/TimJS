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

  // Inline style objects for all components
  const containerStyle = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "65% 35%",
    gridTemplateRows: "34vh 6vh 6vh 34vh",
    gridGap: "15px",
    width: "100%",
    height: "100%",
    padding: "10px 25px",
    backgroundColor: "#f7f9fc",
    borderRadius: "8px",
  };

  const currentDashboardStyle = {
    gridArea: "1 / 1 / 3 / 2",
    width: "100%",
    height: "100%",
  };

  const currentDashboardContentStyle = {
    padding: "15px",
    height: "100%",
  };

  const numberCellGridStyle = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "50% 50%",
    gridTemplateRows: "30% 70%",
    gridGap: "15px",
    height: "100%",
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
    gridArea: "1 / 2 / 2 / -1",
  };

  const barChartStyle = {
    gridArea: "2 / 1 / -1 / -1",
    padding: "15px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const usageListStyle = {
    gridArea: "3 / 1 / -1 / 2",
    width: "100%",
    height: "100%",
    padding: "15px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const usageListContentStyle = {
    overflowY: "auto",
    height: "95%",
  };

  const usageListItemStyle = {
    padding: "15px",
    borderBottom: "1px solid #eee",
    width: "100%",
    display: "flex",
    alignItems: "center",
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

  const browsingSummaryStyle = {
    gridArea: "1 / 2 / 4 / -1",
    padding: "5%",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const syncInfoStyle = {
    gridArea: "4 / 2 / -1 / -1",
    backgroundColor: "#000",
    padding: "20px",
    position: "relative",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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

  // Function to fetch data
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

  const formatNumber = (number) => {
    if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
    else if (number >= 1000) return (number / 1000).toFixed(1) + "K";
    else return number.toString();
  };

  const handleBarClick = (data) => {
    if (data && data.name) {
      setActiveCategory((prevCategory) =>
        prevCategory === data.name ? null : data.name
      );
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = "none";
    e.target.nextSibling.style.display = "block";
  };

  const filteredWebsites = activeCategory
    ? websiteDetails.filter((site) => site.category === activeCategory)
    : websiteDetails;

  const getBarColor = (category) => {
    if (category === activeCategory || category === hoveredCategory) {
      return "#555555";
    }
    return "#C4C4C4";
  };

  const capitalizeFirstWord = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Box style={containerStyle}>
      <Box style={currentDashboardStyle}>
        <VStack align="left" style={currentDashboardContentStyle}>
          <h1>
            Dashboard{" "}
            {aggregationInterval && `(${aggregationInterval})`}
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
                    tickFormatter={(value) =>
                      Math.round(value * 10) / 10
                    }
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
                    onMouseEnter={(data) =>
                      setHoveredCategory(data.name)
                    }
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(data) => handleBarClick(data)}
                    cursor="pointer"
                    style={{ transition: "fill 0.2s ease-in-out" }}
                    radius={[30, 30, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </VStack>
      </Box>

      <Box style={usageListStyle}>
        <h1>Usage Summary</h1>
        <Box style={usageListContentStyle}>
          <VStack align="left" spacing={2}>
            {filteredWebsites.length > 0 ? (
              filteredWebsites
                .sort((a, b) => b.time - a.time)
                .map((site) => (
                  <HStack key={site.name} style={usageListItemStyle}>
                    <img
                      src={site.icon}
                      alt={site.name}
                      style={siteIconStyle}
                      onError={handleImageError}
                    />
                    <BiWorld
                      size={24}
                      style={{ display: "none" }}
                    />
                    <VStack align="left" flex="1">
                      <Text fontSize="md">{site.name}</Text>
                      <Text fontSize="sm" style={siteCategoryStyle}>
                        Active: {formatTime(site.time)} | Category:{" "}
                        {site.category}
                      </Text>
                    </VStack>
                    <Text fontSize="sm" style={sitePercentageStyle}>
                      {site.time > 0
                        ? (
                            (site.time /
                              websiteDetails.reduce(
                                (acc, site) => acc + site.time,
                                0
                              )) *
                            100
                          ).toFixed(1) + "%"
                        : "0%"}
                    </Text>
                    <Box
                      style={{
                        ...siteBarStyle,
                        width: `${
                          (site.time /
                            websiteDetails.reduce(
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

      <Box style={browsingSummaryStyle}>
        <h2>Browsing Time</h2>
        <VStack align="left">
          <Box style={roundedBoxStyle}>
            <h3>Total Browsing Time:</h3>
            <h3>{formatTime(totalTime)}</h3>
          </Box>
          <Box style={roundedBoxStyle}>
            <h3>Total Browsing in This {capitalizeFirstWord(aggregationType)}:</h3>
            <h3>{formatTime(aggBrowsing)}</h3>
          </Box>
          <Box style={roundedBoxStyle}>
            <h3>Total URLs Opened:</h3>
            <h3>{formatNumber(totalURLs)}</h3>
          </Box>
          <Box style={roundedBoxStyle}>
            <h3>Total URLs in This {capitalizeFirstWord(aggregationType)}:</h3>
            <h3>{formatNumber(aggURLs)}</h3>
          </Box>
        </VStack>
      </Box>

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
