import React, { useState, useEffect } from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { retrieveYouTubeScrappingData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";
import YouTubeInteractionCard from "../components/InteractionCard";
import "../styles/InteractionAnalysis.css";

const InteractionAnalysis = () => {
  const { aggregationType } = useGlobalContext();
  const [data, setData] = useState([]);
  const [scrapingAllowed, setScrapingAllowed] = useState(false);

  // Load YoutubeContentScrapping from storage on mount
  useEffect(() => {
    chrome.storage.sync.get("YoutubeContentScrapping", (result) => {
      setScrapingAllowed(result.YoutubeContentScrapping || false);
    });
  }, []);

  // Fetch chart data when aggregationType or scrapingAllowed changes
  useEffect(() => {
    if (scrapingAllowed) {
      retrieveYouTubeScrappingData(aggregationType, (processedData) => {
        setData(processedData);
      });
    } else {
      setData([]); // Clear data if scraping is disabled
    }
  }, [aggregationType, scrapingAllowed]);

  // Toggle YoutubeContentScrapping value in storage
  const toggleScrapingAllowed = () => {
    const newValue = !scrapingAllowed;
    chrome.storage.sync.set({ YoutubeContentScrapping: newValue }, () => {
      setScrapingAllowed(newValue);
      if (!newValue) {
        chrome.storage.local.set({ youtube_scrapping: {} }); // Clear data if disabled
      }
    });
  };

  // Format the data to match the structure required by Nivo's RadialBar
  const formattedData = [
    {
      id: "Video",
      data: data.map((entry) => ({
        x: entry.name, // Genre name
        y: entry.Video, // Video value
      })),
    },
    {
      id: "Shorts",
      data: data.map((entry) => ({
        x: entry.name, // Genre name
        y: entry.Shorts, // Shorts value
      })),
    },
  ];

  return (
    <div className="analysis-container">
      <YouTubeInteractionCard
        title="YouTube Interaction Analysis"
        icon="path/to/facebook-icon.png" // Replace with the actual icon path
        graph={
          <ResponsiveRadialBar
            data={formattedData}
            valueFormat=">-.2f"
            padding={0.4}
            cornerRadius={2}
            margin={{ top: 40, right: 120, bottom: 40, left: 40 }}
            radialAxisStart={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
            circularAxisOuter={{ tickSize: 5, tickPadding: 12, tickRotation: 0 }}
            legends={[
              {
                anchor: "right",
                direction: "column",
                justify: false,
                translateX: 80,
                translateY: 0,
                itemsSpacing: 6,
                itemDirection: "left-to-right",
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: "#999",
                symbolSize: 18,
                symbolShape: "square",
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
    </div>
  );
};

export default InteractionAnalysis;
