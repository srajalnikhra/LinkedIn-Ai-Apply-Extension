let activeApplyData = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Open side panel
  if (message.type === "OPEN_PANEL") {
    const tabId = sender.tab?.id;
    if (tabId) chrome.sidePanel.open({ tabId });
    return;
  }

  // New post selected
  if (message.type === "POST_SELECTED") {
    activeApplyData = message.payload;

    chrome.runtime.sendMessage({
      type: "POST_SELECTED",
      payload: activeApplyData
    });
    return;
  }

  // Generate email
  if (message.type === "GENERATE_AI_EMAIL") {
    const email = activeApplyData?.email || "";

    let company = "Hiring Manager";
    if (email.includes("@")) {
      company = email.split("@")[1].split(".")[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }

    chrome.storage.local.get(["resumeText"], (data) => {
      const resume = data.resumeText || "";

      const emailBody = `
Subject: Application for Golang Backend Developer

Dear ${company},

I am writing to apply for the Golang Backend Developer role.

I have hands-on experience in Golang, backend development, and scalable systems.
${resume ? "My background includes real-world projects and strong problem-solving skills." : ""}

I would love to connect and discuss how I can contribute to your team.

Best regards,  
Srajal
      `.trim();

      sendResponse({ success: true, emailBody });
    });

    return true;
  }
});
