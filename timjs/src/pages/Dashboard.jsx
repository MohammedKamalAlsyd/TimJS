import React, { useState, useEffect } from "react";
import "../styles/Dashboard.css";
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

  useEffect(() => {
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
    fetchData();
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
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    } else {
      return number.toString();
    }
  };

  const handleBarClick = (data) => {
    if (data && data.name) {
      setActiveCategory((prevCategory) =>
        prevCategory === data.name ? null : data.name
      );
    }
  };

  const handleImageError = (e) => {
    // When the image fails to load, hide the image and show the fallback icon
    e.target.style.display = 'none';  // Hide the image
    e.target.nextSibling.style.display = 'block';  // Show the fallback icon
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
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

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
                      onError={handleImageError} // Attach onError event
                    />
                    <BiWorld
                    size={24}
                    className= "site_icon"
                    style={{ display: 'none' }} // Initially hidden
                    />
                    <VStack alignItems="left" flexGrow={1}>
                      <Text fontSize="md">{site.name}</Text>
                      <Text fontSize="sm" className="site_category">
                        Active: {formatTime(site.time)} | Category: {site.category}
                      </Text>
                    </VStack>
                    <Text fontSize="sm" className="site_percentage">
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
                      className="site_bar"
                      style={{
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

      <Box className="browsing_summary">
        <h2 className="label">Browsing Time</h2>
        <VStack alignItems="left">
          <Box className="roundedBoxStyle">
            <h3>Total Browsing Time:</h3>
            <h3>{formatTime(totalTime)}</h3>
          </Box>
          <Box className="roundedBoxStyle">
            <h3>Total Browsing in This {capitalizeFirstWord(aggregationType)}:</h3>
            <h3>{formatTime(aggBrowsing)}</h3>
          </Box>
          <Box className="roundedBoxStyle">
            <h3>Total URLs Opened:</h3>
            <h3>{formatNumber(totalURLs)}</h3>
          </Box>
          <Box className="roundedBoxStyle">
            <h3>Total URLs in This {capitalizeFirstWord(aggregationType)}:</h3>
            <h3>{formatNumber(aggURLs)}</h3>
          </Box>
        </VStack>
      </Box>

      <Box className="sync_info">
        <h1 style={{ color: "floralwhite", fontWeight: 200 }}>
          Account Sync Information
        </h1>
        <h2
          style={{ color: "floralwhite", fontWeight: 200, padding: "15px 0px" }}
        >
          Feature Not Implemented Yet
        </h2>
        <button
          disabled={true}
          className="sync-button"
          style={{ cursor: "not-allowed", position: "absolute", bottom: "30px", right: "25px" }}
        >
          Sync
        </button>
      </Box>
    </Box>
  );
};

export default TimeTracker;
