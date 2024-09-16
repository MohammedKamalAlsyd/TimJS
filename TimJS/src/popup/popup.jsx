import React from 'react';
import { Button, Spacer } from '@chakra-ui/react';

const PopupApp = () => {
  const openDashboardOnPopup = () => {
    const popupUrl = chrome.runtime.getURL('popup.html');
    const dashboardUrl = `${popupUrl.replace('popup.html', '')}dashboard`;

    chrome.tabs.create({ url: dashboardUrl });
  };

  return (
    <div>
      <h2>TimJS</h2>
      <Spacer/>
      <Button onClick={openDashboardOnPopup}>
        Go to Dashboard
      </Button>
    </div>
  );
};

export default PopupApp;