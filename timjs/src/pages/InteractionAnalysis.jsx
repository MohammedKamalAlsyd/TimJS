import React, { useState, useEffect } from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { retrieveInteractionData  } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";
import YouTubeInteractionCard from "../components/InteractionCard";
import { SocialIcon } from 'react-social-icons'
import "../styles/InteractionAnalysis.css";
import { VStack,Box } from "@chakra-ui/react";

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

  return (
    <Box className="interaction-analysis-container">
      <h1>
        Interaction Analysis {aggregationInterval && `(${aggregationInterval})`}
      </h1>
      <VStack padding={'12px'} gap={4}>
      <YouTubeInteractionCard
        title="Youtube"
        icon= <SocialIcon url="https://youtube.com" label={`Youtube icon`} as="div" style={{ width: "40px",height: "40px" }}/>
        graph={
          <ResponsiveRadialBar
            data={formattedData}
            valueFormat={(value) => `${value.toFixed(2)} min`}
            padding={0.4}
            cornerRadius={2}
            margin={{ right: 500}}
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
                itemHeight: 18,
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
