import React from 'react';
import '../styles/TimeTracker.css'
import { Box } from '@chakra-ui/react';

const TimeTracker = () => {
  return (
    <Box className='dashboard-container'>
      <Box className="current_dashboard">1</Box>
      <Box className="previous_dashboard">2</Box>
      <Box className="usage_summary">3</Box>
      <div class="item item-4" style={{background:'black'}}>4</div>


      

    </Box>
  );
};

export default TimeTracker;
