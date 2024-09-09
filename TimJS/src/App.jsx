//import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider, HStack } from '@chakra-ui/react';
import customTheme from './assets/styles/chakra-theme';
import Sidebar from './assets/components/Sidebar';
import Routes from './routes';
import './assets/styles/global.css'

function App() {
  return (
      <ChakraProvider theme={customTheme}>
        <Router>
            <HStack>
              <Sidebar/>
              <Routes />
            </HStack>
        </Router>
      </ChakraProvider>
  )
}

export default App
