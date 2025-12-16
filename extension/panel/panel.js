const emailInput = document.getElementById("email");
const emailBody = document.getElementById("emailBody");
const generateBtn = document.getElementById("generate");
const sendBtn = document.getElementById("sendBtn");

// Receive data from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SET_PANEL_DATA") {
    emailInput.value = message.payload.email || "";
    emailBody.value = "";
  }
});

// Generate AI email
generateBtn.onclick = () => {
  chrome.runtime.sendMessage(
    {
      type: "GENERATE_AI_EMAIL",
      payload: { email: emailInput.value }
    },
    (response) => {
      if (response?.success) {
        emailBody.value = response.emailBody;
      }
    }
  );
};

// Send via Gmail
sendBtn.onclick = () => {
  const subject = encodeURIComponent("Job Application");
  const body = encodeURIComponent(emailBody.value);
  const to = encodeURIComponent(emailInput.value);

  window.open(
    `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`,
    "_blank"
  );
};
