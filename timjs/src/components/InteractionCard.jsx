import React, { useState } from "react";
import { Switch, Tooltip,Box, VStack, Flex ,Spacer } from "@chakra-ui/react"; // Import Chakra UI components
import '../styles/InteractionCard.css';


const InteractionCard = ({ title, icon, graph, onSwitchChange, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box className="roundedBoxStyle interaction-card">
      <VStack>
      <Flex className="interaction-header" alignItems='center' gap='4'>
        {icon}
        <h2 className="interaction-title">{title}</h2>
        <Spacer />
        <Box display='flex' alignItems='center' gap={5} padding={"0px 12px"}>
        <h2>Activate Script:</h2>
        <Tooltip
          label={isActive 
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
            className={`interaction-switch ${isHovered ? 'hovered' : ''}`}
          />
        </Tooltip>
        </Box>
      </Flex>
      <div className={`interaction-graph ${isActive ? '' : 'hidden'}`}>
        {graph}
      </div>
      </VStack>
    </Box>
  );
};

export default InteractionCard;
