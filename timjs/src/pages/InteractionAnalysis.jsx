import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { retrieveYouTubeScrappingData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";

const InteractionAnalysis = () => {
  const { aggregationType } = useGlobalContext(); // Read aggregation type from global context
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="time" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No Enough Data</p>
      )}
    </div>
  );
};

export default InteractionAnalysis;
