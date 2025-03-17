import React, { useState, useEffect, useMemo } from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { retrieveInteractionData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";
import YouTubeInteractionCard from "../components/InteractionCard";
import { SocialIcon } from "react-social-icons";
import { Box, Flex, VStack, HStack, Text } from "@chakra-ui/react";

/**
 * A small helper component to show a modern "No data" placeholder.
 */
const NoData = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100%"
      overflow="hidden"
    >
      <Text fontSize="xl" fontWeight="bold" color="gray.500">
        No data available
      </Text>
    </Box>
  );
};

/**
 * A simple color palette for categories, based on a stable hash approach.
 */
const colorPalette = [
  "#FF6B6B", // Light-ish red
  "#FFA94D", // Orange
  "#FFD43B", // Yellow
  "#69DB7C", // Green
  "#38D9A9", // Teal
  "#4DABF7", // Light blue
  "#74C0FC", // Blue
  "#B197FC", // Purple
  "#F783AC", // Pink
  "#F15BB5", // Magenta
  "#D3F9D8", // Light green
  "#FFD6A5", // Light orange
  "#B2F2BB", // Lighter green
  "#A5D8FF", // Lighter blue
  "#DFD3F2", // Very light purple
];

/**
 * Stable function to pick a color for a given category name.
 */
const getColorForCategory = (categoryName) => {
  // For "SELECT_ALL", return a neutral color.
  if (categoryName === "SELECT_ALL") return "transparent";

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

/**
 * A custom Legend component that displays categories (including "Select All")
 * in multiple columns if needed, shows active categories in bold, and
 * calls toggleCategory on click.
 */
const Legend = ({ categories, activeCategories, toggleCategory }) => {
  if (!categories || !categories.length) return null;

  // Decide how many items per column before splitting.
  const maxItemsPerColumn = 10;
  const columns = [];
  for (let i = 0; i < categories.length; i += maxItemsPerColumn) {
    columns.push(categories.slice(i, i + maxItemsPerColumn));
  }

  return (
    <Flex direction="row" gap="20px" fontSize="12px" ml="-10px">
      {columns.map((colData, colIndex) => (
        <VStack key={colIndex} spacing="8px" align="start">
          {colData.map((item) => {
            const isActive = activeCategories[item.id];
            const color = isActive ? getColorForCategory(item.id):'transparent';
            return (
              <HStack
                key={item.id}
                spacing="6px"
                cursor="pointer"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                onClick={() => toggleCategory(item.id)}
                title={item.label}
              >
                {/* Colored circle indicator */}
                <Box w="12px" h="12px" borderRadius="full" bg={color} />
                <Text>{item.label}</Text>
              </HStack>
            );
          })}
        </VStack>
      ))}
    </Flex>
  );
};

const InteractionAnalysis = () => {
  const { aggregationType } = useGlobalContext();

  // State for chart data, scraping flag, aggregation interval, and active categories.
  const [chartData, setChartData] = useState([]);
  const [scrapingAllowed, setScrapingAllowed] = useState(false);
  const [aggregationInterval, setAggregationInterval] = useState("");
  const [activeCategories, setActiveCategories] = useState({});

  // Fetch chart data from the backend/processor.
  const fetchData = async () => {
    const { processedData, aggregationInterval } = await retrieveInteractionData(aggregationType);
    setChartData(processedData || []);
    setAggregationInterval(aggregationInterval || "");
  };

  // Initialize activeCategories when chartData is loaded (including "SELECT_ALL").
  useEffect(() => {
    if (chartData.length && Object.keys(activeCategories).length === 0) {
      // By default, set everything to active, including "SELECT_ALL".
      const newActive = { SELECT_ALL: true };
      chartData.forEach((entry) => {
        newActive[entry.name] = true;
      });
      setActiveCategories(newActive);
    }
  }, [chartData, activeCategories]);

  // Format time values for human readability.
  const formatTimeValue = (minutes) => {
    if (minutes >= 1440) {
      const days = minutes / 1440;
      return `${days.toFixed(2)} days`;
    } else if (minutes >= 60) {
      const hours = minutes / 60;
      return `${hours.toFixed(2)} hours`;
    } else {
      return `${minutes.toFixed(2)} mins`;
    }
  };

  // Load the YoutubeContentScrapping flag from storage on mount.
  useEffect(() => {
    chrome.storage.sync.get("YoutubeContentScrapping", (result) => {
      setScrapingAllowed(result.YoutubeContentScrapping || false);
    });
  }, []);

  // Fetch data on mount and whenever aggregationType or scrapingAllowed changes.
  useEffect(() => {
    fetchData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [aggregationType, scrapingAllowed]);

  // Toggle YoutubeContentScrapping value in storage.
  const toggleScrapingAllowed = () => {
    const newValue = !scrapingAllowed;
    chrome.storage.sync.set({ YoutubeContentScrapping: newValue }, () => {
      setScrapingAllowed(newValue);
    });
  };

  /**
   * Toggle the active state for a given category.
   * "SELECT_ALL" is treated specially:
   *  - If toggled ON, all categories become active.
   *  - If toggled OFF, all categories become inactive.
   */
  const toggleCategory = (categoryName) => {
    setActiveCategories((prev) => {
      const newState = { ...prev };
      if (categoryName === "SELECT_ALL") {
        const wasActive = newState["SELECT_ALL"];
        Object.keys(newState).forEach((k) => {
          newState[k] = !wasActive;
        });
      } else {
        newState[categoryName] = !newState[categoryName];
        if (!newState[categoryName]) {
          newState["SELECT_ALL"] = false;
        } else {
          const allActiveExceptSelectAll = Object.keys(newState)
            .filter((k) => k !== "SELECT_ALL")
            .every((cat) => newState[cat]);
          if (allActiveExceptSelectAll) {
            newState["SELECT_ALL"] = true;
          }
        }
      }
      return newState;
    });
  };

  // Create fixed series for "Video" and "Shorts", then filter out inactive data points.
  const formattedData = useMemo(() => {
    if (!chartData.length) return [];
    const series = [
      {
        id: "Video",
        data: chartData.map((entry) => ({
          x: entry.name,
          y: entry.Video,
        })),
      },
      {
        id: "Shorts",
        data: chartData.map((entry) => ({
          x: entry.name,
          y: entry.Shorts,
        })),
      },
    ];
    return series.map((s) => ({
      ...s,
      data: s.data.filter((point) => activeCategories[point.x]),
    }));
  }, [chartData, activeCategories]);

  // Prepare an array for the legend, including our "Select All" item.
  const legendData = useMemo(() => {
    if (!chartData.length) return [];
    const categories = chartData.map((entry) => ({
      id: entry.name,
      label: entry.name.replace(/&amp;/g, "&"),
    }));
    return [{ id: "SELECT_ALL", label: "Select All" }, ...categories];
  }, [chartData]);

  // Check if there's any visible data.
  const hasData = useMemo(() => {
    if (!chartData.length) return false;
    return formattedData.some((series) => series.data.length > 0);
  }, [chartData, formattedData]);

  return (
    <Box
      px="25px"
      py="10px"
      width="100%"
      height="100%"
      position="relative"
      bg="#f7f9fc"
      borderRadius="8px"
      overflow="hidden"
      opacity={1}
      transition="opacity 0.5s ease-out"
    >
      <Text as="h1" mb="20px">
        Interaction Analysis {aggregationInterval && `(${aggregationInterval})`}
      </Text>

      <VStack p="12px" gap={4} width="100%" overflow="hidden">
        <YouTubeInteractionCard
          title="Youtube"
          icon={
            <SocialIcon
              url="https://youtube.com"
              label="Youtube icon"
              style={{ width: "40px", height: "40px" }}
            />
          }
          graph={
            <Flex minH="400px" width="100%" overflow="hidden">
              {/* Chart Area */}
              <Box flex="1" overflow="hidden">
                {hasData ? (
                  <ResponsiveRadialBar
                    data={formattedData}
                    valueFormat={(value) => formatTimeValue(value)}
                    padding={0.4}
                    cornerRadius={2}
                    colors={(bar) => getColorForCategory(bar.data.x)}
                    margin={{ left: 40, right: 40, top: 40, bottom: 40 }}
                    radialAxisStart={{
                      tickSize: 12,
                      tickPadding: 12,
                      tickRotation: 0,
                    }}
                    circularAxisOuter={{
                      tickSize: 12,
                      tickPadding: 12,
                      tickRotation: 0,
                    }}
                    legends={[]}
                  />
                ) : (
                  <NoData />
                )}
              </Box>
              {/* Custom Legend on the right */}
              {chartData && (
                <Box minH="400px" p="10px" overflow="hidden">
                  <Text mb="8px" fontWeight="bold">
                    Categories:
                  </Text>
                  <Legend
                    categories={legendData}
                    activeCategories={activeCategories}
                    toggleCategory={toggleCategory}
                  />
                </Box>
              )}
            </Flex>
          }
          onSwitchChange={toggleScrapingAllowed}
          isActive={scrapingAllowed}
        />
      </VStack>
    </Box>
  );
};

export default InteractionAnalysis;
