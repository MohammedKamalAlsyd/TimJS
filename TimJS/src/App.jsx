//import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider, HStack, VStack } from '@chakra-ui/react';
import customTheme from './assets/styles/chakra-theme';
import Sidebar from './assets/components/Sidebar';
import Routes from './routes';
import Header from './assets/components/Header';
import './assets/styles/Global.css'

function App() {
  return (
      <ChakraProvider theme={customTheme}>
        <Router>
            <HStack justifyContent={'start'} height={'100%'}>
              <Sidebar/>
              <VStack height={'full'} width={'full'} padding={'35px 35px 35px 35px'} margin={'0px 35px'}>
                <Header/>
                <Routes />
              </VStack>
            </HStack>
        </Router>
      </ChakraProvider>
  )
}

export default App
