import React, { useEffect, useState } from 'react';
import '../styles/App.css';
import DataProcessor from '../../utils/DataProcessor';

const Home = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processor = new DataProcessor();
    setMessage(processor.sayHello());

    // Log message to console to ensure background script and data sharing
    chrome.runtime.sendMessage({ type: 'LOG_DATA', data: 'Home Page Loaded' });
  }, []);

  return (
    <div className="home-container">
      <nav>
        <ul className="navbar">
          <li><a href="#/">Home</a></li>
          <li><a href="#/about">About</a></li>
          <li><a href="#/contact">Contact</a></li>
        </ul>
      </nav>
      <div className="message">
        <p>Message: {message}</p>
      </div>
    </div>
  );
};

export default Home;