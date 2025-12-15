chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "OPEN_PANEL") {
    chrome.sidePanel.open({
      tabId: sender.tab.id
    });

    // Store data so panel can read it
    chrome.storage.local.set({
      applyData: {
        emails: message.emails,
        postText: message.postText
      }
    });
  }
});
