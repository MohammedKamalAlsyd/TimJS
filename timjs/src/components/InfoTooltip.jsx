import React, { useState } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";

const InfoTooltip = ({ message }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Inline styles for the tooltip
  const containerStyle = {
    position: "relative",
    display: "inline-block",
    cursor: "pointer",
  };

  const iconStyle = {
    fontSize: "1.5rem",
    color: "#1e41db",
    transition: "color 0.3s ease",
  };

  const iconHoverStyle = {
    color: "#3d5afe",
  };

  const tooltipStyle = {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "5px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontSize: "0.875rem",
    width: "200px",
    textAlign: "center",
    whiteSpace: "normal",
    zIndex: 1000,
    opacity: 0.9,
    transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IoIosInformationCircleOutline
        style={isHovered ? { ...iconStyle, ...iconHoverStyle } : iconStyle}
      />
      {isHovered && <div style={tooltipStyle}>{message}</div>}
    </div>
  );
};

export default InfoTooltip;
