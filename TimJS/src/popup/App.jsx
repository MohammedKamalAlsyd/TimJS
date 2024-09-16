//import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { Button, ChakraProvider, HStack, VStack } from '@chakra-ui/react';
import customTheme from '../assets/styles/chakra-theme';
import Sidebar from '../assets/components/Sidebar';
import Routes from './routes';
import Header from '../assets/components/Header';
import '../assets/styles/Global.css'

function App() {
  const handleClick = () => {
    window.open('../src/homepage/homepage.html', '_blank', 'noopener, noreferrer');
  };


  return (
      <ChakraProvider theme={customTheme}>
        <Router>
            <Routes />
            <Button colorScheme='gray' onClick={handleClick}>Open Main Page</Button>
        </Router>
      </ChakraProvider>
  )
}

export default App
