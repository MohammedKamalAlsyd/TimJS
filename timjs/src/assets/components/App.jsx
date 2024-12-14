import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Popup from './Popup';
import Home from './Home';
import '../styles/App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Popup />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;