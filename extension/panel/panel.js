// panel/panel.js

const emailInput = document.getElementById("email");
const textArea = document.getElementById("emailBody");
const generateBtn = document.getElementById("generate");

// 🔹 Function to load data into panel
function loadApplyData() {
  chrome.storage.local.get("applyData", (res) => {
    if (!res.applyData) return;

    emailInput.value = res.applyData.email;
    textArea.value = "Click 'Generate AI Email' to create content...";
  });
}

// 🔹 Initial load
loadApplyData();

// 🔹 🔥 THIS FIXES THE ISSUE 🔥
// Listen for Apply button clicks (storage updates)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.applyData) {
    loadApplyData();
  }
});

// 🔹 Generate AI email
generateBtn.onclick = () => {
  chrome.storage.local.get("applyData", (res) => {
    if (!res.applyData) return;

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_AI_EMAIL",
        payload: res.applyData,
      },
      (response) => {
        if (response?.success) {
          textArea.value = response.emailBody;
        }
      }
    );
  });
};
