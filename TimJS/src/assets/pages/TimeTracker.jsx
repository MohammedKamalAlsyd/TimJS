import React, { useState, useEffect } from 'react';
import '../styles/TimeTracker.css'
import { Box, HStack, VStack,Text, Spacer } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import WebClassification from '../../classification/Web Classification.json';  // Assuming you have this file

const TimeTracker = () => {
  const [chartData, setChartData] = useState([]);

  // Load data from storage once and categorize
  const processData = (websiteData) => {
    const categoryMap = {};

    // Preprocess the data by mapping websites to categories in one step
    Object.keys(websiteData).forEach(website => {
      const timeSpent = websiteData[website].time;
      const category = WebClassification[website]?.Category || 'Unknown';

      // Aggregate time by category
      if (categoryMap[category]) {
        categoryMap[category] += timeSpent;
      } else {
        categoryMap[category] = timeSpent;
      }
    });

    // Convert the category map to a format suitable for the chart
    const formattedData = Object.keys(categoryMap).map(category => ({
      name: category,
      hours: (categoryMap[category] / 60).toFixed(2)  // Convert minutes to hours
    }));

    // Update chart data in one step
    setChartData(formattedData);
  };

  useEffect(() => {
    // Simulate fetching the websiteData from chrome.storage.local
    chrome.storage.local.get('websiteData', (result) => {
      const todayData = result.websiteData[getCurrentDate()] || {};
      processData(todayData);
    });
  }, []);


  // Helper function to get the current date in "YYYY-MM-DD" format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];  // "YYYY-MM-DD"
  };

  return (
    <Box className='dashboard_container'>
      <Box className="current_dashboard">
        <VStack alignItems={'left'} padding={'15px'} height={'100%'}>
          <h1>
            Current Dashboard (27/9/2019)
          </h1>
          <Box className='number_cell_grid'>
            <Box gridArea={'1 / 1 / 2 / 2'} className='number_cell'>
              <VStack alignItems={'left'}>
                  <Text className='label'>Wasted Time</Text>
                  <Spacer/>
                  <Text className='green-text'> 1 Hour 32 Mintues</Text>
                </VStack>
            </Box>
            <Box gridArea={'1 / 2 / 2 / -1'} className='number_cell'>
              <VStack alignItems={'left'}>
                <Text className='label'>Wasted Time</Text>
                <Spacer/>
                <Text className='red-text'> 1 Hour</Text>
              </VStack>
            </Box>
            <Box style={{gridArea: '2 / 1 / -1 / -1' }}>
            <BarChart
                width={600}
                height={300}
                data={chartData}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14, fill: '#999' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 14, fill: '#999' }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={40}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#999' }}
                />
                <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Bar 
                  dataKey="hours" 
                  fill="#C4C4C4" 
                  radius={[10, 10, 0, 0]}  // Rounded bars
                  animationDuration={1500}
                />
              </BarChart>
            </Box>
          </Box>
        </VStack>
      </Box>

      <Box className="previous_dashboard">
        2
      </Box>
      <Box className="usage_summary">3</Box>
      <Box className="sync_info">4</Box>
    </Box>
  );
};

export default TimeTracker;
