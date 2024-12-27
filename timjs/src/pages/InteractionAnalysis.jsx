// interactionAnalysis.jsx
import React, { useState, useEffect } from "react";
import Sunburst from "sunburst-chart"; // Import Sunburst-chart library
import { retrieveYouTubeScrappingData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";

const InteractionAnalysis = () => {
  const { aggregationType } = useGlobalContext(); // Read aggregation type from global context
  const [data, setData] = useState([]);
  const [scrapingAllowed, setScrapingAllowed] = useState(false);

  const chartRef = React.useRef(null); // Reference to the chart container

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

  // Render Sunburst chart when data changes
  useEffect(() => {
    if (data.length > 0 && chartRef.current) {
      Sunburst()
        .data({ name: "YouTube", children: data })
        .width(chartRef.current.offsetWidth)
        .height(400)
        .color((d) => (d.children ? "#82ca9d" : "#8884d8"))
        .tooltipContent((d) => `${d.data.name}: ${d.value?.toFixed(2)} hrs`)
        (chartRef.current);
    }
  }, [data]);

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

  return (
    <div style={{ padding: "10px" }}>
      <h1>YouTube Interaction Analysis</h1>
      <label>
        <input
          type="checkbox"
          checked={scrapingAllowed}
          onChange={toggleScrapingAllowed}
        />
        Enable YouTube Scraper
      </label>
      {data.length > 0 ? (
        <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
      ) : (
        <p>No Enough Data</p>
      )}
    </div>
  );
};

export default InteractionAnalysis;
