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
    // Use model from message (for dual-model support) or fall back to stored model
    const MODEL_NAME = msg.model || "gemini-3-flash-preview";

    console.log(`[BG] Using model: ${MODEL_NAME}`);

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
});
