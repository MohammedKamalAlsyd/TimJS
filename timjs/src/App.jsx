import React from "react";
import { Routes, Route } from "react-router-dom"; // React Router for routing
import { ChakraProvider, HStack, VStack,Box } from "@chakra-ui/react";
import Popup from "./pages/Popup";
import Dashboard from "./pages/Dashboard";
import InteractionAnalysis from "./pages/InteractionAnalysis";
import PatternFinder from "./pages/PatternFinder";
import "./styles/App.css";
import customTheme from "./styles/chakra-theme";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { GlobalProvider } from "./utils/GlobalContext";

// Layout component now uses a single "isPage" prop to conditionally render layout structure
const Layout = ({ isPage, children }) => {
  // If not a page, simply render the children as is.
  if (!isPage) {
    return (    
    <Box style={{height:'360px',width:'360px'}}>
      {children}
    </Box>
    )
  }

  // If it's a page, render the layout with sidebar and header.
  return (
    <HStack justifyContent="start" height="100%" width="100%">
      <Sidebar />
      <VStack
        height="full"
        width="full"
        padding="35px"
        margin="0px 35px"
      >
        <Header />
        {children}
      </VStack>
    </HStack>
  );
};

const App = () => {
  return (
    <ChakraProvider theme={customTheme}>
      <GlobalProvider>
        <Routes>
          <Route
            path="/"
            element={
              // Render as non-page: no header or sidebar
              <Layout isPage={false}>
                <Popup />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              // Render as page: include header and sidebar
              <Layout isPage={true}>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/interaction-analysis"
            element={
              <Layout isPage={true}>
                <InteractionAnalysis />
              </Layout>
            }
          />
          <Route
            path="/pattern-finder"
            element={
              <Layout isPage={true}>
                <PatternFinder />
              </Layout>
            }
          />
        </Routes>
      </GlobalProvider>
    </ChakraProvider>
  );
};

export default App;
