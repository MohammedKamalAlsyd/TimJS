import React from "react";
import { Icon, Box, Flex, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

function SidebarItem({ icon, title, active }) {
  // Inline style objects for SidebarItem
  const containerStyle = {
    width: "100%",
    textDecoration: "none",
  };

  const boxStyle = {
    height: "40px",
    display: "flex",
  };

  const flexStyle = {
    flexDirection: "row",
    gap: "15px",
    alignItems: "center",
  };

  const iconStyle = {
    marginLeft: "40px",
    fontSize: "20px",
  };

  const titleStyle = {
    fontWeight: active ? 600 : "inherit",
    margin: 0,
  };

  return (
    <Link as={RouterLink} to={`/${title.toLowerCase().replace(/\s/g, '-')}`} style={containerStyle}>
      <Box style={boxStyle}>
        <Flex style={flexStyle}>
          <Icon as={icon} style={iconStyle} />
          <h3 style={titleStyle}>{title}</h3>
        </Flex>
      </Box>
    </Link>
  );
}

export default SidebarItem;
