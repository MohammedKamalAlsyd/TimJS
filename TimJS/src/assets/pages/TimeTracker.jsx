import React from 'react';
import '../styles/TimeTracker.css'
import { Box, HStack, VStack,Text, Spacer } from '@chakra-ui/react';

const TimeTracker = () => {
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
            <Box style={{gridArea: '2 / 1 / -1 / -1' ,background:'green'}}>
                Graph Here
            </Box>
          </Box>
        </VStack>
      </Box>

      <Box className="previous_dashboard">
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
            <Box style={{gridArea: '2 / 1 / -1 / -1' ,background:'green'}}>
                Graph Here
            </Box>
          </Box>
        </VStack>
      </Box>
      <Box className="usage_summary">3</Box>
      <Box className="sync_info">3</Box>

    </Box>
  );
};

export default TimeTracker;
