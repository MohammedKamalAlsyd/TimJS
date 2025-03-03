import React, { useRef, useState, useEffect } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { FaAngleDown } from "react-icons/fa";
import { useGlobalContext } from "../utils/GlobalContext";

const Header = () => {
  const { aggregationType, changeAggregationType } = useGlobalContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(aggregationType);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const dropdownRef = useRef(null);
  const comparisonRef = useRef(null);

  const comparisonOptions = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ];

  const saveAggregationTypeToStorage = (value) => {
    chrome.storage.local.set({ aggregationType: value }, () => {
      console.log("Aggregation type saved:", value);
    });
  };

  const getAggregationTypeFromStorage = () => {
    chrome.storage.local.get(["aggregationType"], (result) => {
      if (result.aggregationType) {
        setSelectedOption(result.aggregationType);
        changeAggregationType(result.aggregationType);
      }
    });
  };

  const handleOptionClick = (value) => {
    setSelectedOption(value);
    changeAggregationType(value);
    saveAggregationTypeToStorage(value);
    setShowOptions(false);
  };

  const handleOutsideClick = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      comparisonRef.current &&
      !comparisonRef.current.contains(event.target)
    ) {
      setShowDropdown(false);
      setShowOptions(false);
    }
  };

  useEffect(() => {
    // Load aggregation type from storage when component mounts
    getAggregationTypeFromStorage();
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Inline style objects
  const headerStyle = {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e0e0e0",
    width: "100%",
    backgroundColor: "#f8f9fa",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    zIndex: 10,
  };

  const comparisonTypeStyle = {
    display: "flex",
    alignItems: "center",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#333333",
    marginRight: "8px",
  };

  const customSelectStyle = {
    position: "relative",
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #cccccc",
    backgroundColor: "#ffffff",
    color: "#333333",
    cursor: "pointer",
    transition: "box-shadow 0.3s ease, border-color 0.3s ease",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const optionsContainerStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    opacity: showOptions ? 1 : 0,
    visibility: showOptions ? "visible" : "hidden",
    transform: showOptions ? "translateY(0)" : "translateY(-8px)",
    transition: "all 0.3s ease",
    zIndex: 1000,
  };

  const optionStyle = {
    padding: "10px",
    fontSize: "14px",
    color: "#333333",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  };

  const selectedOptionStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  // A small arrow added as a span
  const arrowStyle = {
    fontSize: "10px",
    marginLeft: "8px",
    color: "#444444",
  };

  const userSectionStyle = {
    display: "flex",
    alignItems: "center",
    position: "relative",
  };

  const dropdownIconStyle = {
    cursor: "pointer",
    color: "#333333",
    transition: "transform 0.3s ease",
    fontSize: "20px",
  };

  const dropdownIconActiveStyle = {
    transform: "rotate(180deg)",
  };

  const dropdownMenuStyle = {
    position: "absolute",
    top: "50px",
    right: 0,
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    width: "200px",
    opacity: showDropdown ? 1 : 0,
    visibility: showDropdown ? "visible" : "hidden",
    transform: showDropdown ? "translateY(0)" : "translateY(-10px)",
    transition: "all 0.3s ease",
    zIndex: 1000,
  };

  const dropdownMenuLinkStyle = {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#333333",
    fontSize: "14px",
    transition: "background-color 0.2s ease",
  };

  const submenuStyle = {
    position: "relative",
  };

  const submenuSpanStyle = {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#333333",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  };

  const submenuArrowStyle = {
    fontSize: "12px",
    marginRight: "4px",
    color: "#444444",
    transition: "transform 0.3s ease",
  };

  // Conditional submenu options style based on state:
  const submenuOptionsStyle = {
    position: "absolute",
    top: 0,
    right: "calc(100% + 8px)",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    width: "180px",
    opacity: showSubmenu ? 1 : 0,
    visibility: showSubmenu ? "visible" : "hidden",
    transform: showSubmenu ? "translateX(0)" : "translateX(10px)",
    transition: "all 0.3s ease",
    zIndex: 1000,
  };

  return (
    <div style={headerStyle}>
      {/* Comparison Type Dropdown */}
      <div style={comparisonTypeStyle} ref={comparisonRef}>
        <label style={labelStyle}>Aggregation Type:</label>
        <div
          style={customSelectStyle}
          onClick={() => setShowOptions((prev) => !prev)}
        >
          <div style={selectedOptionStyle}>
            {comparisonOptions.find((opt) => opt.value === selectedOption)?.label}
            <span style={arrowStyle}>▼</span>
          </div>
          <div style={optionsContainerStyle}>
            {comparisonOptions.map((option) => (
              <div
                key={option.value}
                style={optionStyle}
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f3f5")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Dropdown Menu */}
      <HStack style={userSectionStyle} spacing="1vw" ref={dropdownRef}>
        <h3 style={{ color: "gray", fontSize: "12px", fontWeight: 500 }}>
          Version: 1.0.0
        </h3>
        <FaAngleDown
          style={
            showDropdown
              ? { ...dropdownIconStyle, ...dropdownIconActiveStyle }
              : dropdownIconStyle
          }
          onClick={() => setShowDropdown((prev) => !prev)}
        />
        <div style={dropdownMenuStyle}>
          <div
            style={submenuStyle}
            onMouseEnter={() => setShowSubmenu(true)}
            onMouseLeave={() => setShowSubmenu(false)}
          >
            <span style={submenuSpanStyle}>
              <span style={submenuArrowStyle}>◀</span>
              Support The Project
            </span>
            <div style={submenuOptionsStyle}>
              <a
                href="https://github.com/MohammedKamalAlsyd/TimJS"
                target="_blank"
                rel="noopener noreferrer"
                style={dropdownMenuLinkStyle}
              >
                Give Star on GitHub
              </a>
              <a
                href="https://www.kaggle.com/code/mohammedkamalalsyd/timjs-data-processing"
                target="_blank"
                rel="noopener noreferrer"
                style={dropdownMenuLinkStyle}
              >
                Upvote on Kaggle
              </a>
            </div>
          </div>
          <a
            href="https://github.com/MohammedKamalAlsyd/TimJS/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={dropdownMenuLinkStyle}
          >
            Report Issue
          </a>
        </div>
      </HStack>
    </div>
  );
};

export default Header;
