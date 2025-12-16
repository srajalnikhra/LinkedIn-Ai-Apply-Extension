const emailInput = document.getElementById("email");
const emailBody = document.getElementById("emailBody");
const generateBtn = document.getElementById("generate");

// Receive data from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PANEL_DATA") {
    emailInput.value = message.payload.email || "";
    emailBody.value = "";
  }
});

// Generate AI email
generateBtn.onclick = () => {
  chrome.runtime.sendMessage(
    {
      type: "GENERATE_AI_EMAIL",
      payload: {}
    },
    (response) => {
      if (response?.success) {
        emailBody.value = response.emailBody;
      }
    }
  );
};
