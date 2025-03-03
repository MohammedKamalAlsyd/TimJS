import React, { useState, useEffect } from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { retrieveInteractionData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";
import YouTubeInteractionCard from "../components/InteractionCard";
import { SocialIcon } from "react-social-icons";
import { VStack, Box, Text } from "@chakra-ui/react";

const InteractionAnalysis = () => {
  const { aggregationType } = useGlobalContext();

  // State variables
  const [chartData, setChartData] = useState([]);
  const [scrapingAllowed, setScrapingAllowed] = useState(false);
  const [aggregationInterval, setAggregationInterval] = useState("");

  // Fetch chart data when aggregationType or scrapingAllowed changes
  const fetchData = async () => {
    const { processedData, aggregationInterval } = await retrieveInteractionData(aggregationType);
    setChartData(processedData || []);
    setAggregationInterval(aggregationInterval || "");
  };

  // Helper to format time values for human readability
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

  // Load YoutubeContentScrapping from storage on mount
  useEffect(() => {
    chrome.storage.sync.get("YoutubeContentScrapping", (result) => {
      setScrapingAllowed(result.YoutubeContentScrapping || false);
    });
  }, []);

  // Fetch data on mount and when scrapingAllowed changes
  useEffect(() => {
    fetchData();

    // Listen for visibility change events
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData(); // Refetch data when the page becomes visible again
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [aggregationType, scrapingAllowed]);

  // Toggle YoutubeContentScrapping value in storage
  const toggleScrapingAllowed = () => {
    const newValue = !scrapingAllowed;
    chrome.storage.sync.set({ YoutubeContentScrapping: newValue }, () => {
      setScrapingAllowed(newValue);
    });
  };

  // Format the data to match the structure required by Nivo's RadialBar
  const formattedData = [
    {
      id: "Video",
      data: chartData.map((entry) => ({
        x: entry.name, // Genre name
        y: entry.Video, // Video value
      })),
    },
    {
      id: "Shorts",
      data: chartData.map((entry) => ({
        x: entry.name, // Genre name
        y: entry.Shorts, // Shorts value
      })),
    },
  ];

  // Inline style for the container
  const containerStyle = {
    padding: "10px 25px",
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: "#f7f9fc",
    borderRadius: "8px",
    // Simple fade-in effect using opacity transition
    opacity: 1,
    transition: "opacity 0.5s ease-out",
  };

  const headerStyle = {
    marginBottom: "20px",
    fontFamily: "Arial, sans-serif",
  };

  return (
    <Box style={containerStyle}>
      <Text as="h1" style={headerStyle}>
        Interaction Analysis {aggregationInterval && `(${aggregationInterval})`}
      </Text>
      <VStack padding="12px" gap={4}>
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
            <ResponsiveRadialBar
              data={formattedData}
              valueFormat={(value) => formatTimeValue(value)}
              padding={0.4}
              cornerRadius={2}
              margin={{ right: 500 }}
              radialAxisStart={{ tickSize: 12, tickPadding: 12, tickRotation: 0 }}
              circularAxisOuter={{ tickSize: 12, tickPadding: 12, tickRotation: 0 }}
              legends={[
                {
                  anchor: "top-right",
                  direction: "column",
                  justify: true,
                  translateX: 50,
                  translateY: 0,
                  itemHeight: 18,
                  itemsSpacing: 12,
                  itemDirection: "left-to-right",
                  itemWidth: 100,
                  itemTextColor: "#999",
                  symbolSize: 12,
                  symbolShape: "circle",
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000",
                      },
                    },
                  ],
                },
              ]}
            />
          }
          onSwitchChange={toggleScrapingAllowed}
          isActive={scrapingAllowed}
        />
      </VStack>
    </Box>
  );
};

export default InteractionAnalysis;
