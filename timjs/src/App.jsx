import {React,useState} from 'react';
import { HashRouter as Router, Route, Routes,useLocation } from 'react-router-dom';
import { ChakraProvider, HStack, VStack } from '@chakra-ui/react';
import Popup from './pages/Popup';
import Home from './pages/Home';
import './styles/App.css';
import customTheme from './styles/chakra-theme';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './styles/Global.css'

const App = () => {
  const isPopup = useLocation()=== '/';
  return (
    <ChakraProvider theme={customTheme}>
      <Router>
        {
          isPopup?
          <HStack justifyContent={'start'} height={'100%'}>
            <Sidebar/>
            <VStack height={'full'} width={'full'} padding={'35px 35px 35px 35px'} margin={'0px 35px'}>
              <Header/>
              <Routes>
                <Route path="/" element={<Popup />} /> {/*try to use index instead of path=/*/}
                <Route path="/home" element={<Home />} />
              </Routes>
            </VStack>
          </HStack>:
          <Routes>
            <Route path="/" element={<Popup />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        }
        
      </Router>
    </ChakraProvider>
  );
};

export default App;