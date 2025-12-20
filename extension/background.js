// --- 1. GMAIL SENDING HELPER ---
async function sendGmail(token, emailData) {
  const res = await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'message/rfc822'
    },
    body: JSON.stringify({ raw: emailData })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Gmail API Error");
  }
  return true;
}

// --- 2. MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // A. OPEN PANEL
  if (msg.type === "OPEN_PANEL") {
    if (sender.tab?.id) chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  // B. SAVE DATA
  if (msg.type === "SET_PANEL_DATA") {
    chrome.storage.local.set({
      recruiterEmail: msg.payload.email || "",
      postText: msg.payload.postText || ""
    });
  }

  // C. GENERATE AI (Gemini)
  if (msg.type === "GENERATE_WITH_GEMINI") {
    const MODEL_NAME = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${msg.apiKey}`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: msg.prompt }] }]
      })
    })
    .then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        sendResponse({ success: true, text: text });
      } else {
        sendResponse({ success: false, error: data.error?.message || "Unknown Error" });
      }
    })
    .catch((err) => {
      sendResponse({ success: false, error: "Network Error: " + err.message });
    });
    return true; // Async
  }

  // D. SEND GMAIL (The Fix)
  if (msg.type === "SEND_GMAIL_API") {
    
    // 1. Get Token (Interactive = True asks user if needed)
    chrome.identity.getAuthToken({ interactive: true }, async function(token) {
      if (chrome.runtime.lastError || !token) {
        console.error("Login Error:", chrome.runtime.lastError);
        sendResponse({ success: false, error: "Login Failed. Check Extensions settings." });
        return;
      }

      // 2. Send Email using the Token
      try {
        await sendGmail(token, msg.rawMessage);
        sendResponse({ success: true });
      } catch (err) {
        console.error("Sending Error:", err);
        // If 401, remove token and retry? (Advanced, but let's just return error for now)
        sendResponse({ success: false, error: err.message });
      }
    });

    return true; // Keep channel open for Async response
  }
});