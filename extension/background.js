chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // 1. OPEN PANEL
  if (msg.type === "OPEN_PANEL") {
    if (sender.tab?.id) chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  // 2. SAVE DATA
  if (msg.type === "SET_PANEL_DATA") {
    chrome.storage.local.set({
      recruiterEmail: msg.payload.email || "",
      postText: msg.payload.postText || ""
    });
  }

  // 3. GENERATE (RAW MODE)
  if (msg.type === "GENERATE_WITH_GEMINI") {
    
    // Hardcoded to the model we saw in your screenshot
    const MODEL_NAME = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${msg.apiKey}`;

    console.log("Sending request to:", MODEL_NAME);

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: msg.prompt }] }]
      })
    })
    .then(async (response) => {
      const data = await response.json();
      
      // If success
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        sendResponse({ success: true, text: text });
      } 
      // If error (return the RAW message so we can see it)
      else {
        console.error("Gemini Error:", data);
        sendResponse({ 
          success: false, 
          error: `Google Error (${response.status}): ${data.error?.message || "Unknown"}` 
        });
      }
    })
    .catch((err) => {
      sendResponse({ success: false, error: "Network Error: " + err.message });
    });

    return true; // Keep channel open
  }
});