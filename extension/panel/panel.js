const applyView = document.getElementById("applyView");
const settingsView = document.getElementById("settingsView");

const openSettings = document.getElementById("openSettings");
const backBtn = document.getElementById("backBtn");

const recruiterEmail = document.getElementById("recruiterEmail");
const emailBody = document.getElementById("emailBody");
const resumeStatus = document.getElementById("resumeStatus");

// -------- View Toggle --------
openSettings.onclick = () => {
  applyView.classList.remove("active");
  settingsView.classList.add("active");
};

backBtn.onclick = () => {
  settingsView.classList.remove("active");
  applyView.classList.add("active");
};

// -------- Listen for new Apply --------
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "POST_SELECTED") {
    recruiterEmail.value = message.payload.email || "";
    emailBody.value = "";
    settingsView.classList.remove("active");
    applyView.classList.add("active");
  }
});

// -------- Resume Upload --------
document.getElementById("uploadResume").onclick = () => {
  const fileInput = document.getElementById("resumeFile");

  if (!fileInput.files.length) {
    resumeStatus.textContent = "Please choose a file first";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    chrome.storage.local.set({ resumeText: reader.result }, () => {
      resumeStatus.textContent = "Resume uploaded successfully ✅";
    });
  };

  reader.readAsText(fileInput.files[0]);
};

// -------- Generate Email --------
document.getElementById("generateEmail").onclick = () => {
  chrome.runtime.sendMessage(
    { type: "GENERATE_AI_EMAIL" },
    (response) => {
      emailBody.value = response?.emailBody || "Failed to generate email.";
    }
  );
};

// -------- Send Gmail --------
document.getElementById("sendGmail").onclick = () => {
  const body = emailBody.value;
  const email = recruiterEmail.value;
  if (!email || !body) return;

  const url =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(email)}` +
    `&body=${encodeURIComponent(body)}`;

  chrome.tabs.create({ url });
};
