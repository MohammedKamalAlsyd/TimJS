chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension Installed!');
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'LOG_DATA') {
      console.log('Background Script:', message.data);
    }
  });