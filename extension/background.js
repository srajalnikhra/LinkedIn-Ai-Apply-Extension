// 1. Helper to clean the key
function cleanKey(key) {
  if (!key) return "";
  return key.trim().replace(/[\r\n]/g, "");
}

// 2. Helper to FIND the correct model name dynamically
async function getWorkingModel(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.models) {
      console.warn("Could not list models. Defaulting to Flash.");
      return "gemini-1.5-flash"; 
    }

    // Filter for models that support generating content
    const validModels = data.models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes("generateContent")
    );

    // Strategy: Try to find Flash, then Pro, then whatever is left
    const flashModel = validModels.find(m => m.name.includes("flash"));
    if (flashModel) return flashModel.name.replace("models/", "");

    const proModel = validModels.find(m => m.name.includes("pro"));
    if (proModel) return proModel.name.replace("models/", "");

    // Fallback to the first available model
    if (validModels.length > 0) {
      return validModels[0].name.replace("models/", "");
    }

    return "gemini-1.5-flash"; // Absolute fallback

  } catch (e) {
    console.error("Error fetching model list:", e);
    return "gemini-1.5-flash";
  }
}

// 3. Helper to Generate Content
async function generateContent(apiKey, prompt) {
  const cleanApiKey = cleanKey(apiKey);
  
  // STEP 1: Auto-detect the correct model for this key
  const modelName = await getWorkingModel(cleanApiKey);
  console.log(`[LinkedIn AI] Auto-detected model: ${modelName}`);

  // STEP 2: Call the API with the detected model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanApiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API Error (${modelName})`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// 4. Message Listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "OPEN_PANEL") {
    if (sender.tab?.id) chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  if (msg.type === "SET_PANEL_DATA") {
    chrome.storage.local.set({
      recruiterEmail: msg.payload.email || "",
      postText: msg.payload.postText || ""
    });
  }

  if (msg.type === "GENERATE_WITH_GEMINI") {
    (async () => {
      try {
        const text = await generateContent(msg.apiKey, msg.prompt);
        sendResponse({ text: text });
      } catch (err) {
        console.error("Generation Failed:", err);
        sendResponse({ 
          text: `FAILED: ${err.message}. \n\nCheck Console (F12) > Background Page for details.` 
        });
      }
    })();
    return true; // Keep channel open
  }
});