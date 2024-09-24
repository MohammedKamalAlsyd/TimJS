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
  const [animationDone, setAnimationDone] = useState(false);

  const WASTED_CATEGORIES = [
    'Social Media',
    'Shopping',
    'Arts & Entertainment',
    'Games',
    'Life Style & Hobbies',
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
    'Travel',
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
      const category = WebClassification[website]?.Category || 'Other';
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
      const dates = Object.keys(websiteData);
      const latestDate = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;

      if (latestDate) {
        const todayData = websiteData[latestDate];
        processData(todayData);
      }
    });

    // Trigger animation after component mounts
    setAnimationDone(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true); // Set to true after a short delay
    }, 300); // Adjust the duration as needed

    return () => clearTimeout(timer);
  }, []);

  const getDynamicDomain = (data) => {
    if (data.length === 0) return [1, 24]; // Fallback to default if no data

    // Get the maximum value of hours from the data
    const maxValue = Math.max(...data.map((item) => parseFloat(item.hours) || 0));

    // Set the lower limit as 1 (minimum) and the upper limit higher than the maxValue
    const lowerLimit = Math.max(1, Math.floor(maxValue)); // Ensure at least 1
    const upperLimit = lowerLimit + lowerLimit * 0.25; // Set upper limit to 25% more than the max value

    return [lowerLimit, upperLimit]; // Return dynamic domain
  };

  // Helper function to get the current date in "YYYY-MM-DD" format
  function getCurrentDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000); // Adjust for local time zone
    return localDate.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"
  }

  // Handle bar chart click to filter the list by category
  const handleBarClick = (data) => {
    // Safety check for activePayload
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedCategory = data.activePayload[0].payload.name;
      if (activeCategory === clickedCategory) {
        setActiveCategory(null); // Remove filter if the same category is clicked
        setFilteredCategory(null); // Reset filtered category
      } else {
        setActiveCategory(clickedCategory); // Set the new category filter
        setFilteredCategory(clickedCategory); // Set the filtered category
      }
    }
  };

  // Filtered websites based on selected category from the bar chart
  const filteredWebsites = filteredCategory
    ? websiteData.filter((site) => site.category === filteredCategory)
    : websiteData;

  // Filtered chart data based on active category
  const filteredChartData = activeCategory
    ? chartData.filter((item) => item.name === activeCategory)
    : chartData;

  // Get dynamic domain based on filteredChartData
  const domain = getDynamicDomain(filteredChartData);

  const formatTime = (minutes) => {
    if (minutes < 1) return 'Less than 1 minute';
    const h = Math.floor(minutes / 60);
    const m = (minutes % 60).toFixed(0);
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
                  data={filteredChartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  barSize={40}
                  onClick={(data) => handleBarClick(data.activePayload[0].payload)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(value) => Math.round(value)} // Round to the nearest integer
                    domain={domain} // Set the dynamic domain here
                    tick={{ fontSize: 10, fill: '#999' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    label={{
                      value: 'Hours',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 10,
                      fill: '#999',
                      x: -10,
                    }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                  <Bar
                    dataKey="hours"
                    fill="#C4C4C4"
                    radius={[10, 10, 0, 0]}
                    animationDuration={300} // Faster animation
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </VStack>
      </Box>

      <Box className="usage_list">
        {/* Website Usage List */}
        <VStack alignItems={'left'} spacing={4} padding={'15px'} overflowY={'scroll'}>
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
