import React, { useState, useEffect, useRef } from 'react';
import '../styles/Header.css'; // Import the separate CSS file
import { HStack } from '@chakra-ui/react';
import { CgProfile } from "react-icons/cg";
import { FaAngleDown } from "react-icons/fa";

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // Ref for dropdown
  const iconRef = useRef(null); // Ref for FaAngleDown

  // Toggle dropdown visibility
  const toggleDropdown = (e) => {
    e.stopPropagation(); // Prevent closing immediately when clicking the icon
    setShowDropdown((prev) => !prev);
  };

  // Close dropdown if clicking outside
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current && 
      !dropdownRef.current.contains(event.target) && 
      iconRef.current && 
      !iconRef.current.contains(event.target)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="header">
      <div className="comparison-type">
        <label htmlFor="comparison">Comparison Type:</label>
        <select id="comparison">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <HStack className="user-section" spacing='1vw'>
        <CgProfile fontSize={'25px'} />
        <h2>Welcome, Olivia Carter</h2>
        <FaAngleDown 
          ref={iconRef} 
          className={`dropdown-icon ${showDropdown ? 'dropdown-icon-active' : ''}`} // Rotate icon when active
          fontSize={'30px'} 
          onClick={toggleDropdown}
        />

        {/* Dropdown Menu */}
        <div 
          className={`dropdown-menu ${showDropdown ? 'show-dropdown' : ''}`} 
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
        >
          <a href="#">Support Project</a>
          <a href="#">Logout</a>
        </div>
      </HStack>
    </div>
  );
};

export default Header;
