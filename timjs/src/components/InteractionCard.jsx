import React, { useState } from "react";
import { Switch, Tooltip, Box, VStack, Flex, Spacer, Text } from "@chakra-ui/react";

const InteractionCard = ({ title, icon, graph, onSwitchChange, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Inline styles for the card container and its elements
  const cardContainerStyle = {
    width: "100%",
    transition: "opacity 0.3s ease-in-out, height 0.3s ease-in-out",
    opacity: 1,
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "15px",
    width: "100%",
  };

  const titleStyle = {
    letterSpacing: "1.2px",
    fontWeight: 500,
    margin: 0,
    fontFamily: "Arial, sans-serif",
  };

  const switchStyle = {
    transition: "all 0.2s ease-in-out",
    transform: isHovered ? "scale(1.05)" : "scale(1)",
  };

  const graphStyle = {
    width: "100%",
    height: "20vw",
    margin: "10px auto",
    transition: "opacity 0.3s ease-in-out, height 0.3s ease-in-out",
  };

  const hiddenGraphStyle = {
    opacity: 0,
    height: 0,
    overflow: "hidden",
  };

  return (
    <Box style={cardContainerStyle}>
      <VStack spacing={4}>
        <Flex style={headerStyle}>
          {icon}
          <Text as="h2" style={titleStyle}>
            {title}
          </Text>
          <Spacer />
          <Box display="flex" alignItems="center" gap="5px" padding="0px 12px">
            <Text>Activate Script:</Text>
            <Tooltip
              label={
                isActive
                  ? "Any browsing YouTube data during this tool off will not be saved, causing gaps in your analysis."
                  : "This will scrape YouTube tabs, which may affect performance on low-end PCs."
              }
              placement="top"
            >
              <Switch
                isChecked={isActive}
                onChange={onSwitchChange}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                size="lg"
                colorScheme="gray"
                style={switchStyle}
              />
            </Tooltip>
          </Box>
        </Flex>
        <Box style={isActive ? graphStyle : hiddenGraphStyle}>{graph}</Box>
      </VStack>
    </Box>
  );
};

export default InteractionCard;
