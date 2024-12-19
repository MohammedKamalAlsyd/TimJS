import React, { useState } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import "../styles/InfoTooltip.css"; // Make sure to create this file for the CSS

const InfoTooltip = ({ message }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="info-tooltip-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IoIosInformationCircleOutline className="info-icon" />
      {isHovered && <div className="tooltip-message">{message}</div>}
    </div>
  );
};

export default InfoTooltip;
