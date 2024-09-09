//import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider, HStack } from '@chakra-ui/react';
import customTheme from './assets/styles/chakra-theme';
import Sidebar from './assets/components/Sidebar';
import Routes from './routes';
import './assets/styles/global.css'

function App() {
  return (
    <>
      <Router>
        <ChakraProvider theme={customTheme}>
          <HStack>
            <Sidebar/>
            <Routes />
          </HStack>
        </ChakraProvider>
      </Router>
    </>
  )
}

export default App
