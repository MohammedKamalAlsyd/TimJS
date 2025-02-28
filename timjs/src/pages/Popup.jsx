import React, { useState, useEffect } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { GoClockFill } from 'react-icons/go'; // High-quality icon from sidebar
import '../styles/App.css';

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
  return localDate.toISOString().split('T')[0];
}

const Popup = () => {
  const [browsingTime, setBrowsingTime] = useState(0);

  // Fetch browsing time for today on component mount
  useEffect(() => {
    const fetchData = async () => {
      const trackingData = await fetchFromStorage('trackingData');
      const today = getCurrentDate();
      const todaySessions = trackingData?.sessions?.[today] || {};
      const totalTime = Object.values(todaySessions).reduce((acc, site) => acc + site.time, 0);
      setBrowsingTime(totalTime);
    };
    fetchData();
  }, []);

  const handleButtonClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('action/default_popup.html#/dashboard') });
  };

  return (
    <Box
      p={6}
      bg="#FFFFFF"
      borderRadius={8}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
      w="100%" // Full width
      maxW="500px" // Optional: limit max width for readability
      mx="auto" // Center horizontally
      textAlign="center"
    >
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
        <Text fontSize="md" color="#666666" maxW="80%">
          TimJS tracks your web usage to help you optimize productivity. Explore detailed insights and patterns in the dashboard.
        </Text>

        {/* Navigation Button */}
        <Button
          onClick={handleButtonClick}
          bg="#000000"
          color="#FFFFFF"
          borderRadius="0"
          px={6}
          py={3}
          _hover={{ bg: '#333333' }}
          _focus={{ outline: 'none', boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.3)' }}
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