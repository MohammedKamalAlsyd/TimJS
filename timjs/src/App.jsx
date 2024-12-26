import React from "react";
import { Routes, Route } from "react-router-dom"; // Import Routes and Route
import { ChakraProvider, HStack, VStack } from "@chakra-ui/react";
import Popup from "./pages/Popup";
import Dashboard from "./pages/Dashboard";
import InteractionAnalysis from "./pages/InteractionAnalysis";
import PatternFinder from "./pages/PatternFinder";
import UsageForecast from "./pages/UsageForecast";
import EmptyPage from './pages/empty'
import "./styles/App.css";
import customTheme from "./styles/chakra-theme";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { GlobalProvider } from "./utils/GlobalContext"; // Adjust the import path

const Layout = ({ children, showSidebar = true, showHeader = true }) => {
  return (
    <HStack justifyContent={"start"} height={"100%"} width={"100%"}>
      {showSidebar && <Sidebar />}
      <VStack
        height={"full"}
        width={"full"}
        padding={"35px"}
        margin={showSidebar ? "0px 35px" : "0px"}
      >
        {showHeader && <Header />}
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
              <Layout showSidebar={false} showHeader={false}>
                <InteractionAnalysis />
                {/* <Popup /> */}
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout showSidebar={true} showHeader={true}>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/interaction-analysis"
            element={
              <Layout showSidebar={true} showHeader={true}>
                <InteractionAnalysis />
              </Layout>
            }
          />
          <Route
            path="/pattern-finder"
            element={
              <Layout showSidebar={true} showHeader={true}>
                <EmptyPage />
              </Layout>
            }
          />
          <Route
            path="/usage-time-forecast"
            element={
              <Layout showSidebar={true} showHeader={true}>
                <EmptyPage />
              </Layout>
            }
          />
        </Routes>
      </GlobalProvider>
    </ChakraProvider>
  );
};

export default App;
