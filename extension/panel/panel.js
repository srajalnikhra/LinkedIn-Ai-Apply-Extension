import * as pdfjsLib from "../lib/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.mjs");

// DOM Elements
const applyView = document.getElementById("applyView");
const settingsView = document.getElementById("settingsView");
const recruiterEmail = document.getElementById("recruiterEmail");
const output = document.getElementById("output");
const openSettings = document.getElementById("openSettings");
const backBtn = document.getElementById("backBtn");
const apiKey = document.getElementById("apiKey");
const saveKey = document.getElementById("saveKey");
const keyStatus = document.getElementById("keyStatus");
const resumeFile = document.getElementById("resumeFile");
const uploadResume = document.getElementById("uploadResume");
const resumeStatus = document.getElementById("resumeStatus");
const genEmail = document.getElementById("genEmail");
const genCover = document.getElementById("genCover");
const sendGmail = document.getElementById("sendGmail");

// Load Data
chrome.storage.local.get(["recruiterEmail", "geminiKey"], (d) => {
  if (d.recruiterEmail) recruiterEmail.value = d.recruiterEmail;
  if (d.geminiKey) apiKey.value = d.geminiKey;
});

// Navigation
openSettings.onclick = () => {
  applyView.classList.add("hidden");
  settingsView.classList.remove("hidden");
};
backBtn.onclick = () => {
  settingsView.classList.add("hidden");
  applyView.classList.remove("hidden");
};

// Save API Key
saveKey.onclick = () => {
  const clean = apiKey.value.trim().replace(/[\r\n]/g, "");
  chrome.storage.local.set({ geminiKey: clean }, () => {
    apiKey.value = clean;
    keyStatus.textContent = "Saved ✅";
    setTimeout(() => keyStatus.textContent = "", 2000);
  });
};

// Upload Resume
uploadResume.onclick = async () => {
  const file = resumeFile.files[0];
  if (!file) return;
  resumeStatus.textContent = "Reading...";
  try {
    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((i) => i.str).join(" ") + "\n";
      }
      chrome.storage.local.set({ resumeText: text }, () => {
        resumeStatus.textContent = "Uploaded ✅";
      });
    } else {
      resumeStatus.textContent = "PDF only!";
    }
  } catch (e) {
    resumeStatus.textContent = "Error!";
    console.error(e);
  }
};

// Generate Function
async function generate(type) {
  output.value = "🔍 Auto-detecting AI model & Generating...\nPlease wait...";

  chrome.storage.local.get(["geminiKey", "resumeText", "postText"], (d) => {
    if (!d.geminiKey) {
      output.value = "Error: API Key missing in Settings.";
      return;
    }
    
    // Fallback for testing without a real post
    const jobText = d.postText || "Software Engineer role requiring generic coding skills.";

    const prompt = `
    You are an expert candidate applying for a job.
    
    JOB DESCRIPTION:
    ${jobText}
    
    MY RESUME:
    ${d.resumeText || "No resume provided."}
    
    TASK:
    Write a professional ${type}. Keep it concise, professional, and do not use placeholders like [Name].
    `;

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_WITH_GEMINI",
        apiKey: d.geminiKey,
        prompt: prompt,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          output.value = "Extension Error: " + chrome.runtime.lastError.message;
        } else {
          output.value = response?.text || "Failed to generate text.";
        }
      }
    );
  });
}

genEmail.onclick = () => generate("Job Application Email");
genCover.onclick = () => generate("Cover Letter");

// Send Gmail
sendGmail.onclick = () => {
  if (!recruiterEmail.value || !output.value) return;
  const subject = "Job Application";
  const body = output.value;
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recruiterEmail.value)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  chrome.tabs.create({ url: url });
};