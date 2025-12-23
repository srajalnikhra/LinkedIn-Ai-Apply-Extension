// --- HELPER: Send Email via Gmail API ---
async function sendGmail(token, emailData) {
  const res = await fetch(
    "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "message/rfc822",
      },
      body: JSON.stringify({ raw: emailData }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Gmail API Error");
  }
  return true;
}

// --- MAIN LISTENER ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_PANEL") {
    if (sender.tab?.id) chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  if (msg.type === "SET_PANEL_DATA") {
    chrome.storage.local.set({
      recruiterEmail: msg.payload.email || "",
      postText: msg.payload.postText || "",
    });
  }

  if (msg.type === "GENERATE_WITH_GEMINI") {
    // KEPT YOUR PREFERRED MODEL
    const MODEL_NAME = "gemini-3-flash-preview";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${msg.apiKey}`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: msg.prompt }] }] }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          sendResponse({ success: true, text: text });
        } else {
          console.error("Gemini API Error:", data); 
          sendResponse({
            success: false,
            error: data.error?.message || "Unknown Gemini Error",
          });
        }
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: "Network Error: " + err.message,
        });
      });
    return true;
  }

  if (msg.type === "SEND_GMAIL_API") {
    console.log("[BG] Received Send Request");

    chrome.identity.getAuthToken({ interactive: true }, async function (token) {
      if (chrome.runtime.lastError || !token) {
        console.error("[BG Error] Auth Failed:", chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: "Login Failed. Check Client ID mismatch in Cloud Console.",
        });
        return;
      }

      console.log("[BG] Token acquired. Sending...");

      try {
        await sendGmail(token, msg.rawMessage);
        console.log("[BG] Sent successfully!");
        sendResponse({ success: true });
      } catch (err) {
        console.error("[BG Error] Send Failed:", err);
        // Retry logic: If token invalid (401), remove it
        if (err.message.includes("401")) {
          chrome.identity.removeCachedAuthToken({ token: token }, () => {
            sendResponse({
              success: false,
              error: "Token expired. Click Send again.",
            });
          });
        } else {
          sendResponse({ success: false, error: err.message });
        }
      }
    });
    return true; // Keep channel open for async identity check
  }
});