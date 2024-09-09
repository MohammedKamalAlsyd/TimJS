import React, {useState, useEffect} from 'react';
import {Flex, Box, VStack, HStack, Spacer } from '@chakra-ui/react';
import '../styles/Sidebar.css';

import {useLocation} from 'react-router-dom';
import SidebarItem from './SidebarItem';


// icons
import { GoClockFill } from "react-icons/go";
import { RiDashboardFill } from "react-icons/ri";
import { LuBarChart3 } from "react-icons/lu";
import { GiGearStickPattern } from "react-icons/gi";
import { LuLineChart } from "react-icons/lu";
import { LuBrainCircuit } from "react-icons/lu";
import { IoSettingsSharp } from "react-icons/io5";





const Sidebar = () => {
    const location = useLocation();
    const [activeItem, setActiveItem] = useState(null);
    const not_display_pages = []

    useEffect(() => {
      // Update active item based on the current pathname
      const pathname = location.pathname;
      setActiveItem(pathname);
      }, [location.pathname]);
      if (not_display_pages.includes(location.pathname)) {
          return <></>;
      }

    return (
      <Flex className="sidebar" direction="column" height="100%">

        <VStack alignItems='flex-start' padding="4%">

          // logo
          <Box margin={"35px"}>
            <HStack justify="flex-end" align="center" gap='1.35vw'>
              <GoClockFill className="logo-pic"/>
              <h1>
                  TimJS
              </h1>
            </HStack>
          </Box>


          <SidebarItem
            icon={RiDashboardFill}
            title="DashBoard"
            active={activeItem === '/dashboard'}
          />

          <SidebarItem
            icon={LuBarChart3}
            title="Interaction analysis"
            active={activeItem === '/interaction-analysis'}
          />

          <SidebarItem
            icon={GiGearStickPattern}
            title="Pattern Finder"
            active={activeItem === '/pattern-finder'}
          />

          <SidebarItem
            icon={LuLineChart}
            title="Usage Time Forecast"
            active={activeItem === '/usage-time-forecast'}
          />

          <SidebarItem
            icon={LuBrainCircuit}
            title="AI Time Optimizer"
            active={activeItem === '/ai-time-optimizer'}
          />


          <Spacer />
         

          <SidebarItem
            icon={IoSettingsSharp}
            title="Setting"
            active={activeItem === '/setting'}
          />

        </VStack>

      </Flex>
    );
  };


export default Sidebar;