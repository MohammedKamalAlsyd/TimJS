import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const InteractionAnalysis = () => {
  const [data, setData] = useState([]);
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "updateData") {
        setData((prev) => [...prev, message.details]);
      }
    });
  }, []);
  const handleScrape = () => {
    if (allow) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes("youtube.com")) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              // The code to execute on the page
              const genreMeta = document.querySelector('meta[itemprop="genre"]');
              const isShorts = window.location.pathname.startsWith('/shorts');
              
              const result = {
                genre: genreMeta ? genreMeta.getAttribute('content') : 'Unknown',
                type: isShorts ? 'Shorts' : 'Video',
              };
              
              console.log('Scraped Data:', result);
              return result; // This will be returned to the callback
            },
          }, (results) => {
            if (results && results.length > 0) {
              const scrapedData = results[0].result;
              console.log('Genre:', scrapedData.genre);
              console.log('Type:', scrapedData.type);
            } else {
              console.error('No results returned from script execution.');
            }
          });
        } else {
          alert("This script only works on YouTube!");
        }
      });
    } else {
      alert("Enable scraping by toggling the 'Allow' option!");
    }
  };

  return (
    <div style={{ padding: "10px" }}>
      <h1>YouTube Video Scraper</h1>
      <button onClick={() => setAllow((prev) => !prev)}>
        {allow ? "Disable" : "Enable"} Scraping
      </button>
      <button onClick={handleScrape} disabled={!allow}>
        Scrape Current Page
      </button>
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="genre" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default InteractionAnalysis;
