chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Get active tab
  if (message.type === "GET_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs);
    });
    return true;
  }

  // Open side panel
  if (message.type === "OPEN_PANEL") {
    chrome.sidePanel.open({ tabId: message.tabId });
    return;
  }

  // Forward post data to panel
  if (message.type === "UPDATE_PANEL_DATA") {
    chrome.runtime.sendMessage({
      type: "PANEL_DATA",
      payload: message.payload
    });
    return;
  }

  // Generate AI email
  if (message.type === "GENERATE_AI_EMAIL") {
    const { jdText } = message.payload;

    const generatedEmail = `
Subject: Application for Golang Backend Developer

Hi,

I came across your post regarding the Golang Backend Developer role.

${jdText ? "Based on the job description, my experience aligns well with your requirements." : ""}

I have strong experience in Golang, backend systems, and scalable applications.
I would love to connect and discuss this opportunity further.

Please find my resume attached.

Best regards,
Srajal
    `.trim();

    sendResponse({
      success: true,
      emailBody: generatedEmail
    });
  }

  return true;
});
