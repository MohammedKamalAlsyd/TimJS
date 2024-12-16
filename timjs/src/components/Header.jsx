import React, { useState, useEffect, useRef } from "react";
import { HStack } from "@chakra-ui/react";
import { FaAngleDown } from "react-icons/fa";
import "../styles/Header.css";

// Shared global state for comparison type
export let globalComparisonType = "daily";
export const getComparisonType = () => globalComparisonType;

const Header = ({ onComparisonChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(globalComparisonType);

  const dropdownRef = useRef(null);
  const comparisonRef = useRef(null);

  const comparisonOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  // Handle comparison option selection
  const handleOptionClick = (value) => {
    setSelectedOption(value);
    globalComparisonType = value;
    setShowDropdown(false);
    if (onComparisonChange) onComparisonChange(value);
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
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="header">
      {/* Comparison Type Dropdown */}
      <div className="comparison-type" ref={comparisonRef}>
        <label>Comparison Type:</label>
        <div
          className="custom-select"
          onClick={() => setShowOptions((prev) => !prev)}
        >
          <div className="selected-option">
            {
              comparisonOptions.find((opt) => opt.value === selectedOption)
                ?.label
            }
          </div>
          <div
            className={`options-container ${showOptions ? "show-options" : ""}`}
          >
            {comparisonOptions.map((option) => (
              <div
                key={option.value}
                className="option"
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Dropdown Menu */}
      <HStack className="user-section" spacing="1vw" ref={dropdownRef}>
        <FaAngleDown
          className={`dropdown-icon ${
            showDropdown ? "dropdown-icon-active" : ""
          }`}
          onClick={() => setShowDropdown((prev) => !prev)}
        />
        <div className={`dropdown-menu ${showDropdown ? "show-dropdown" : ""}`}>
          <div className="submenu">
            <span>
              <span className="submenu-arrow">◀</span>Support The Project
            </span>
            <div className="submenu-options">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Give Star on GitHub
              </a>
              <a
                href="https://donate.example.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donate
              </a>
            </div>
          </div>
          <a
            href="https://github.com/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report Issue
          </a>
        </div>
      </HStack>
    </div>
  );
};

export default Header;
