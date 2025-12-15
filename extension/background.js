// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ✅ Always get correct tab
  if (message.type === "GET_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs);
    });
    return true;
  }

  // ✅ Force open side panel
  if (message.type === "OPEN_PANEL") {
    chrome.sidePanel.open({ tabId: message.tabId });
    return;
  }

  // ✅ Generate AI email (mock)
  if (message.type === "GENERATE_AI_EMAIL") {
    const { email, postText } = message.payload;

    const emailBody = `
Subject: Application for Golang Backend Developer

Hi,

I came across your post regarding the Golang Backend Developer role.
I have strong experience in Golang, backend systems, and scalable applications.

Based on the requirements you shared, I believe my profile aligns well.
I would love to connect and discuss this opportunity further.

Please find my resume attached.

Best regards,
Srajal
`.trim();

    sendResponse({
      success: true,
      emailBody,
    });

    return true;
  }
});
