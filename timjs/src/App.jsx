import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route
import { ChakraProvider, HStack, VStack } from '@chakra-ui/react';
import Popup from './pages/Popup';
import Dashboard from './pages/Dashboard';
import './styles/App.css';
import customTheme from './styles/chakra-theme';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const Layout = ({ children, showSidebar = true, showHeader = true }) => {
  return (
    <HStack justifyContent={'start'} height={'100%'} width={'100%'}>
      {showSidebar && <Sidebar />}
      <VStack
        height={'full'}
        width={'full'}
        padding={'35px'}
        margin={showSidebar ? '0px 35px' : '0px'}
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
      <Routes>
        {/* Popup: No Sidebar, No Header */}
        <Route
          path="/"
          element={
            <Layout showSidebar={false} showHeader={false}>
              <Popup />
            </Layout>
          }
        />
        {/* Home: Include Sidebar and Header */}
        <Route
          path="/dashboard"
          element={
            <Layout showSidebar={true} showHeader={true}>
              <Dashboard />
            </Layout>
          }
        />
      </Routes>
    </ChakraProvider>
  );
};

export default App;
