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
  Global,
} from "recharts";
import InfoTooltip from "../components/InfoTooltip";
import {processBarChartData,  calculateBrowsingTimeByAggregation }  from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";


const TimeTracker = () => {
  const { aggregationType } = useGlobalContext(); // Use the aggregation type from the context
  const [chartData, setChartData] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState(null);
  const [websiteData, setWebsiteData] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [aggBrowsing, setaggBrowsing] = useState(null);
  const [wastedTime, setWastedTime] = useState(0);
  const [workingTime, setWorkingTime] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [aggregationInterval, setAggregationInterval] = useState(""); // To display interval or day

  useEffect(() => {
    chrome.storage.local.get("trackingData", (result) => {
      const websiteData = result.trackingData.sessions || {};
      const { chartData, websiteDetails, wastedTime, workingTime, interval } =
        processBarChartData(websiteData, aggregationType);
      readBrowsingDataFromLocalStorage((browsingData) => {
        const total = calculateTotalBrowsingTime(browsingData);
        const browsingtime = calculateBrowsingTimeByAggregation(browsingData, aggregationType);
        setaggBrowsing(browsingtime);
        setTotalTime(total);
      });
      setChartData(chartData);
      setWebsiteData(websiteDetails);
      setWastedTime(wastedTime);
      setWorkingTime(workingTime);
      setAggregationInterval(interval);
    });
  }, [aggregationType]);

  // Function to read browsing data from local storage
  const readBrowsingDataFromLocalStorage = (callback) => {
    chrome.storage.local.get("trackingData", (data) => {
      if (data.trackingData) {
        callback(data.trackingData.browsing);
      } else {
        callback({});
      }
    });
  };

  // Function to calculate the total browsing time using the "browsing" section directly
  const calculateTotalBrowsingTime = (browsingData) => {
    return Object.values(browsingData).reduce((total, time) => total + time, 0);
  };

  // Function to format time in days, hours, and minutes
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


  const handleBarClick = (data) => {
    if (data && data.name) {
      if (activeCategory === data.name) {
        setActiveCategory(null);
        setFilteredCategory(null);
      } else {
        setActiveCategory(data.name);
        setFilteredCategory(data.name);
      }
    }
  };

  const filteredWebsites = filteredCategory
    ? websiteData.filter((site) => site.category === filteredCategory)
    : websiteData;

  const getBarColor = (category) => {
    if (category === activeCategory || category === hoveredCategory) {
      return "#555555";
    }
    return "#C4C4C4";
  };

  const capitalizeFirstWord = (str) => {
    if (!str) {
      return str; // Return empty string for empty input
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <Box className="dashboard_container">
      <Box className="current_dashboard">
        <VStack alignItems="left" className="current_dashboard_content">
          <h1>
            Dashboard {aggregationInterval && `(${aggregationInterval})`}
          </h1>

          <Box className="number_cell_grid">
            <Box className="number_cell wasted_time">
              <VStack alignItems="left">
                <HStack>
                  <h2>Wasted Time</h2>
                  <Spacer />
                  <InfoTooltip message="Wasted Time is the total time spent on websites like social media, shopping, entertainment, games, lifestyle, and travel." />
                </HStack>
                <Text className="red-text">{formatTime(wastedTime)}</Text>
              </VStack>
            </Box>

            <Box className="number_cell working_time">
              <VStack alignItems="left">
                <HStack>
                  <h2 className="label">Working Time</h2>
                  <Spacer />
                  <InfoTooltip message="Working Time is the total time spent on websites related to technology, tools, business, finance, health, careers, education, and news." />
                </HStack>
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
      <Box className="browsing_summary">
        <h2 className="label">Browsing Time</h2>
        <VStack alignItems="left">
          <Box className="roundedBoxStyle">
            <h3>Total Browsing Time:</h3>
            <h3>{formatTime(totalTime)}</h3>
          </Box>
          <Box className="roundedBoxStyle">
            <h3>Total Browsing in This {capitalizeFirstWord(aggregationType)}:</h3>
            <h3>{formatTime(totalTime)}</h3>
          </Box>
        </VStack>
      </Box>
      <Box className="sync_info">
          <h1 style = {{color:"floralwhite" , fontWeight:200}}>Account Sync Information</h1>
          <h2 style = {{color:"floralwhite" , fontWeight:200, padding:"15px 0px"}}>Feature Not Implemented Yet</h2>
          <button disabled={true} className="sync-button" style = {{cursor: "not-allowed",position:'absolute',bottom:'30px',right:'25px'}}>Sync</button>
      </Box>
    </Box>
  );
};

export default TimeTracker;