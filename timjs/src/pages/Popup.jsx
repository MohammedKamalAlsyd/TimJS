import React, { useState, useEffect } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { GoClockFill } from "react-icons/go";

// Removed external CSS import

// Helper function to fetch data from chrome.storage.local
const fetchFromStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
};

// Helper function to get today's date in "YYYY-MM-DD" format
function getCurrentDate() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
}

const Popup = () => {
  const [browsingTime, setBrowsingTime] = useState(0);

  // Fetch browsing time for today on component mount
  useEffect(() => {
    const fetchData = async () => {
      const trackingData = await fetchFromStorage("trackingData");
      const today = getCurrentDate();
      const totalTime = trackingData?.browsing?.[today] || 0;
      setBrowsingTime(totalTime);
    };
    fetchData();
  }, []);

  const handleButtonClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("action/default_popup.html#/dashboard") });
  };

  // Inline style for the popup container (modern and centered)
  const popupContainerStyle = {
    padding: "24px",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
  };

  return (
    <Box style={popupContainerStyle}>
      <VStack spacing={4} align="center">
        {/* Logo */}
        <GoClockFill size={50} color="#000000" />

        {/* Welcome Message */}
        <Text fontSize="xl" fontWeight="600" color="#333333">
          Welcome to TimJS
        </Text>

        {/* Browsing Summary */}
        <Text fontSize="md" color="#666666">
          Today, you've spent {Math.round(browsingTime)} minutes browsing.
        </Text>

        {/* Description */}
        <Text fontSize="md" color="#666666" maxWidth="80%">
          TimJS tracks your web usage to help you optimize productivity. Explore detailed insights and patterns in the dashboard.
        </Text>

        {/* Navigation Button */}
        <Button
          onClick={handleButtonClick}
          backgroundColor="#000000"
          color="#FFFFFF"
          borderRadius="0"
          px={6}
          py={3}
          _hover={{ backgroundColor: "#333333" }}
          _focus={{ outline: "none", boxShadow: "0 0 0 3px rgba(0, 0, 0, 0.3)" }}
        >
          Go to Dashboard
        </Button>

        {/* Additional Info */}
        <Text fontSize="sm" color="#999999" mt={2}>
          Version 1.0 | © 2023 TimJS
        </Text>
      </VStack>
    </Box>
  );
};

export default Popup;
