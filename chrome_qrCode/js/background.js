// big QR code — Chrome Extension Manifest V3
// Background Service Worker (replaces background.js from Manifest V2)
'use strict';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      bigqr_defaults: {
        qrFgColor: '#000000',
        qrBgColor: '#ffffff',
        qrSize: 180,
        qrEcLevel: 'M',
        qrRadius: 0,
        bcFgColor: '#000000',
        bcBgColor: '#ffffff',
        bcHeight: 80,
        bcBarWidth: 2,
        bcRadius: 0,
        bcShowText: true,
        bcTransparent: false,
        showBorder: false,
        translucentMode: false,
        autoUrl: true,
        rememberText: true,
        defaultFormat: 'png',
        defaultSize: 300,
        showDataCard: false,
        dataCardBorder: false,
        dataCardRadius: 8,
        dataCardFontSize: 12
      }
    });
  }
});

// Respond to messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ url: null });
      }
    });
    // Keep the message channel open for async response
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('bigqr_defaults', (result) => {
      sendResponse(result.bigqr_defaults || {});
    });
    return true;
  }
});
