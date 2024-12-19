import { color, extendTheme } from "@chakra-ui/react";

const customTheme = extendTheme({
  styles: {
    global: (props) => ({
      html: {
        height: "100%",
      },
      body: {
        height: "100%",
        backgroundColor: "#F9F9F9", // Light gray background
        color: "#333333", // Dark gray text color
        margin: 0,
        padding: 0,
        transition: "all 0.3s ease",
        fontSize: "14px", // Smaller base font size
      },
      "#root": {
        height: "100%",
        outerWidth: "100%"
      },
      ".red-text":{
        color:"#C70039",
        fontWeight: "bold"
        },
        ".green-text":{
          color:"teal",
          fontWeight: "bold"
        },
        ".roundedBoxStyle": {
          border: "1px solid #E2E8F0", // Light gray border
          borderRadius: "12px", // Rounded corners
          padding: "16px", // Inner padding
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
          backgroundColor: "#FFFFFF", // White background
        },
      a: {
        color: "#000000",
        textDecoration: "none",
        _hover: {
          textDecoration: "underline",
          color: "#555555",
        },
      },
    }),
  },
  fonts: {
    heading: "'Roboto', sans-serif",
    body: "'Roboto', sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "md",
        fontWeight: "500",
        fontSize: "13px", // Smaller font for buttons
        color: "#000000",
        backgroundColor: "#F1F1F1",
        _hover: {
          backgroundColor: "#E2E2E2",
          transform: "scale(1.03)",
          transition: "all 0.2s ease-in-out",
        },
      },
      variants: {
        solid: {
          bg: "#000000",
          color: "#FFFFFF",
          _hover: {
            bg: "#333333",
          },
        },
        ghost: {
          color: "#333333",
          _hover: {
            bg: "#EAEAEA",
          },
        },
      },
    },
  },
});

export default customTheme;
