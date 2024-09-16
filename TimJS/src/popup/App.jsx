//import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { Button, ChakraProvider, HStack, VStack } from '@chakra-ui/react';
import customTheme from '../assets/styles/chakra-theme';
import '../assets/styles/Global.css'
import Popup from './popup.jsx'

function App() {



  return (
      <ChakraProvider theme={customTheme}>
        <Router>
            <Popup/>
        </Router>
      </ChakraProvider>
  )
}

export default App
