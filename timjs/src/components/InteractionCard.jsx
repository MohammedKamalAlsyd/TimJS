import React, { useState } from "react";
import { Switch, Tooltip } from "@chakra-ui/react"; // Import Chakra UI components
import '../styles/InteractionCard.css';

const InteractionCard = ({ title, icon, graph, onSwitchChange, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="interaction-card">
      <div className="interaction-header">
        <img src={icon} alt={`${title} icon`} className="interaction-icon" />
        <h2 className="interaction-title">{title}</h2>
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
            colorScheme="blue"
            className={`interaction-switch ${isHovered ? 'hovered' : ''}`}
          />
        </Tooltip>
      </div>
      <div className={`interaction-graph ${isActive ? '' : 'hidden'}`}>
        {graph}
      </div>
    </div>
  );
};

export default InteractionCard;
