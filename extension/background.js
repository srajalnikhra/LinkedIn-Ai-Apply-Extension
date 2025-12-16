chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Open side panel
  if (message.type === "OPEN_PANEL") {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.sidePanel.open({ tabId });
    }
    return;
  }

  // Forward data to panel
  if (message.type === "SET_PANEL_DATA") {
    chrome.runtime.sendMessage({
      type: "SET_PANEL_DATA",
      payload: message.payload
    });
    return;
  }

  // Generate email
  if (message.type === "GENERATE_AI_EMAIL") {
    const email = message.payload?.email || "";

    let company = "";
    if (email.includes("@")) {
      company = email.split("@")[1].split(".")[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }

    const emailBody = `
Subject: Application for Golang Backend Developer

Hi ${company || "there"},

I came across your post regarding the Golang Backend Developer role${company ? ` at ${company}` : ""}.

I have strong experience in Golang, backend systems, and building scalable applications.
I enjoy working on clean APIs, performance-focused services, and production-ready systems.

I would love to connect and discuss how I can contribute to your team.

Please find my resume attached.

Best regards,
Srajal
    `.trim();

    sendResponse({
      success: true,
      emailBody
    });

    return true;
  }
});
