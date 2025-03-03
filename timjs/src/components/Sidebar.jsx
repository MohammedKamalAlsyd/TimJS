import React, { useState, useEffect } from 'react';
import { Flex, Box, VStack, HStack, Spacer } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';

// Icons
import { GoClockFill } from "react-icons/go";
import { RiDashboardFill } from "react-icons/ri";
import { LuChartBar } from "react-icons/lu";
import { GiGearStickPattern } from "react-icons/gi";

const Sidebar = () => {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(null);
  const not_display_pages = [];

  useEffect(() => {
    // Update active item based on the current pathname
    setActiveItem(location.pathname);
  }, [location.pathname]);

  if (not_display_pages.includes(location.pathname)) {
    return <></>;
  }

  // Inline style objects
  const sidebarStyle = {
    margin: "0.05%",
    position: "relative",
    top: "0px",
    bottom: "0px",
    width: "17.5%",
    backgroundColor: "#ffffff",
    boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
  };

  const vstackStyle = {
    alignItems: "flex-start",
    padding: "4%",
    height: "100vh",
    gap: "20px",
  };

  const logoContainerStyle = {
    margin: "35px",
  };

  const logoHStackStyle = {
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "1.35vw",
  };

  const logoPicStyle = {
    width: "40px",
    height: "40px",
  };

  const logoTextStyle = {
    fontWeight: "700",
    margin: 0,
  };

  return (
    <Flex style={sidebarStyle} direction="column">
      <VStack style={vstackStyle}>
        {/* Logo */}
        <Box style={logoContainerStyle}>
          <HStack style={logoHStackStyle}>
            <GoClockFill style={logoPicStyle} />
            <h1 style={logoTextStyle}>TimJS</h1>
          </HStack>
        </Box>

        <SidebarItem
          icon={RiDashboardFill}
          title="Dashboard"
          active={activeItem === '/dashboard'}
        />

        <SidebarItem
          icon={LuChartBar}
          title="Interaction analysis"
          active={activeItem === '/interaction-analysis'}
        />

        <SidebarItem
          icon={GiGearStickPattern}
          title="Pattern Finder"
          active={activeItem === '/pattern-finder'}
        />

        <Spacer />
      </VStack>
    </Flex>
  );
};

export default Sidebar;
