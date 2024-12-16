import React from 'react';
import '../styles/App.css';

const Popup = () => {
  const handleButtonClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('action/default_popup.html#/dashboard') });
  };

  return (
    <div className="popup-container">
      <h2>Welcome to the Extension</h2>
      <button onClick={handleButtonClick}>Go to Home Page</button>
    </div>
  );
};

export default Popup;