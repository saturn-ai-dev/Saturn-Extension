/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
  // Enables the sidebar to open when the extension icon is clicked
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// Listen for messages from the side panel or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageContent') {
    // If the sidebar requests content, we can facilitate it if needed,
    // but the sidebar itself can usually run executeScript on the active tab
    // if it has the right permissions (activeTab/scripting).
  }
});
