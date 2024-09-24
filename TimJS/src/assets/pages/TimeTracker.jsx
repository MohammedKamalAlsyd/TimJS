import React, { useState, useEffect } from 'react';
import '../styles/TimeTracker.css';
import { Box, HStack, VStack, Text, Spacer } from '@chakra-ui/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import WebClassification from '../../classification/Web Classification.json'; // Assuming you have this file

const TimeTracker = () => {
  const [chartData, setChartData] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState(null); // To filter based on chart click
  const [websiteData, setWebsiteData] = useState([]); // To store the website usage details
  const [wastedTime, setWastedTime] = useState(0); // Wasted time in minutes
  const [workingTime, setWorkingTime] = useState(0); // Working time in minutes
  const [activeCategory, setActiveCategory] = useState(null); // State to track the currently focused category

  const WASTED_CATEGORIES = [
    'Social Media',
    'Shopping',
    'Arts & Entertainment',
    'Games',
    'Life Style & Hobbies'
  ];

  const WORKING_CATEGORIES = [
    'Technology',
    'Tools',
    'Business & Consumer Services',
    'Finance',
    'Health & Food',
    'Jobs & Careers',
    'Science & Education',
    'News & Sport',
    'Travel'
  ];

  const processData = (data) => {
    const categoryMap = {};
    const websiteDetails = [];
    let totalWastedTime = 0;
    let totalWorkingTime = 0;

    // Process data and categorize websites
    Object.keys(data).forEach((website) => {
      const siteInfo = data[website]; // Get the site information
      const timeSpent = siteInfo.time; // Time spent on the website
      const category = WebClassification[website]?.Category || 'Unknown';
      const icon = siteInfo.icon; // Extracting icon directly from siteInfo

      // Aggregate time by category
      categoryMap[category] = (categoryMap[category] || 0) + timeSpent;

      // Classify as wasted or working time
      if (WASTED_CATEGORIES.includes(category)) {
        totalWastedTime += timeSpent;
      } else if (WORKING_CATEGORIES.includes(category)) {
        totalWorkingTime += timeSpent;
      }

      // Create details for the usage list
      websiteDetails.push({
        name: website,
        time: timeSpent,
        category,
        icon,
      });
    });

    // Convert category data for chart
    const formattedChartData = Object.keys(categoryMap).map((category) => ({
      name: category,
      hours: (categoryMap[category] / 60).toFixed(2), // Convert minutes to hours
    }));

    setChartData(formattedChartData);
    setWebsiteData(websiteDetails);
    setWastedTime(totalWastedTime);
    setWorkingTime(totalWorkingTime);
  };


  useEffect(() => {
    // Fetch website data from storage (simulated)
    chrome.storage.local.get('websiteData', (result) => {
      const websiteData = result.websiteData || {};

      // Get the latest date from the keys
      const dates = Object.keys(websiteData);
      const latestDate = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null; // Find the most recent date

      if (latestDate) {
        const todayData = websiteData[latestDate]; // Access data for the latest date
        processData(todayData);
      }
    });
  }, []);

  // Helper function to get the current date in "YYYY-MM-DD" format
  function getCurrentDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)); // Adjust for local time zone
    return localDate.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"
  }

  // Handle bar chart click to filter the list by category
  const handleBarClick = (data) => {
    const clickedCategory = data.name;
    if (activeCategory === clickedCategory) {
      setActiveCategory(null); // Remove filter if the same category is clicked
    } else {
      setActiveCategory(clickedCategory); // Set the new category filter
    }
  };

  // Filtered chart data based on active category
  const filteredChartData = activeCategory
    ? chartData.filter((item) => item.name === activeCategory)
    : chartData;

  // Filtered websites based on selected category from the bar chart
  const filteredWebsites = filteredCategory
    ? websiteData.filter((site) => site.category === filteredCategory)
    : websiteData;

  // Function to convert time to readable format
  const formatTime = (minutes) => {
    if (minutes < 1) return 'Less than 1 minute';
    const h = Math.floor(minutes / 60);
    const m = (minutes % 60).toFixed(0); // Round minutes to two decimal places
    return `${h} h ${m} m`;
  };

  return (
    <Box className='dashboard_container'>
      <Box className="current_dashboard">
        <VStack alignItems={'left'} padding={'15px'} height={'100%'}>
          <h1>Current Dashboard ({getCurrentDate()})</h1>

          <Box className='number_cell_grid'>
            {/* Wasted Time */}
            <Box gridArea={'1 / 1 / 2 / 2'} className='number_cell'>
              <VStack alignItems={'left'}>
                <Text className='label'>Wasted Time</Text>
                <Spacer />
                <Text className='red-text'>{formatTime(wastedTime)}</Text>
              </VStack>
            </Box>

            {/* Working Time */}
            <Box gridArea={'1 / 2 / 2 / -1'} className='number_cell'>
              <VStack alignItems={'left'}>
                <Text className='label'>Working Time</Text>
                <Spacer />
                <Text className='green-text'>{formatTime(workingTime)}</Text>
              </VStack>
            </Box>

            {/* Bar Chart */}
            <Box style={{ gridArea: '2 / 1 / -1 / -1' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredChartData} // Use filtered data
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }} // Adjust margins
                  barSize={40} // Adjust bar size
                  onClick={(data) => handleBarClick(data.activePayload[0].payload)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#999' }}
                    axisLine={false}
                    tickLine={false}
                    width={30} // Adjust width
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#999' }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                  <Bar dataKey="hours" fill="#C4C4C4" radius={[10, 10, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </VStack>
      </Box>

      <Box className="usage_list">
        {/* Website Usage List */}
        <VStack alignItems={'left'} spacing={4} mt={6} overflow={'scroll'} padding={'15px'}>
          {filteredWebsites.length > 0 ? (
            filteredWebsites
              .sort((a, b) => b.time - a.time) // Sort by time, largest to smallest
              .map((site) => (
                <HStack
                  key={site.name}
                  padding={3}
                  borderBottom={'1px solid #eee'}
                  width="100%"
                  className="usage-list-item"
                >
                  <img src={site.icon} alt={site.name} style={{ width: 40, height: 40 }} />
                  <VStack alignItems="left" flexGrow={1}>
                    <Text fontSize="md">{site.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Active: {formatTime(site.time)} | Category: {site.category} {/* Display category here */}
                    </Text>
                  </VStack>
                  <Text fontSize="sm" color="gray.400">
                    {site.time > 0
                      ? ((site.time / websiteData.reduce((acc, site) => acc + site.time, 0)) * 100).toFixed(1) + '%'
                      : '0%'}
                  </Text>
                  <Box
                    borderRadius="5px"
                    height="10px"
                    width={`${(site.time / websiteData.reduce((acc, site) => acc + site.time, 0)) * 100}%`}
                    backgroundColor="teal.500" // You can change this color as needed
                    marginLeft="10px" // Optional: Add some spacing to the left of the bar
                  />
                </HStack>
              ))
          ) : (
            <Text>No websites to display.</Text>
          )}

        </VStack>
      </Box>

      <Box className="usage_summary">3</Box>
      <Box className="sync_info">4</Box>
    </Box>
  );
};

export default TimeTracker;
