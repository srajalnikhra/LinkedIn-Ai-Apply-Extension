import * as pdfjsLib from "../lib/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.mjs");

// --- DOM ELEMENTS ---
const applyView = document.getElementById("applyView");
const settingsView = document.getElementById("settingsView");
const recruiterEmail = document.getElementById("recruiterEmail");
const toneSelect = document.getElementById("toneSelect");
const output = document.getElementById("output");
const apiKey = document.getElementById("apiKey");
const resumeFile = document.getElementById("resumeFile");
const openSettings = document.getElementById("openSettings");
const backBtn = document.getElementById("backBtn");
const saveKey = document.getElementById("saveKey");
const uploadResume = document.getElementById("uploadResume");
const genEmail = document.getElementById("genEmail");
const genCover = document.getElementById("genCover");
const sendGmail = document.getElementById("sendGmail");
const copyText = document.getElementById("copyText");
const keyStatus = document.getElementById("keyStatus");
const resumeStatus = document.getElementById("resumeStatus");

// PROFILE INPUTS
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail"); 
const userPhone = document.getElementById("userPhone");
const userLinkedIn = document.getElementById("userLinkedIn");
const userGithub = document.getElementById("userGithub");
const saveProfile = document.getElementById("saveProfile");
const profileStatus = document.getElementById("profileStatus");


// --- INITIAL LOAD ---
chrome.storage.local.get([
  "recruiterEmail", "geminiKey", 
  "userName", "userEmail", "userPhone", "userLinkedIn", "userGithub"
], (d) => {
  if (d.recruiterEmail) recruiterEmail.value = d.recruiterEmail;
  if (d.geminiKey) apiKey.value = d.geminiKey;
  if (d.userName) userName.value = d.userName;
  if (d.userEmail) userEmail.value = d.userEmail;
  if (d.userPhone) userPhone.value = d.userPhone;
  if (d.userLinkedIn) userLinkedIn.value = d.userLinkedIn;
  if (d.userGithub) userGithub.value = d.userGithub;
});

// --- NAVIGATION ---
openSettings.onclick = () => {
  applyView.classList.add("hidden");
  settingsView.classList.remove("hidden");
};
backBtn.onclick = () => {
  settingsView.classList.add("hidden");
  applyView.classList.remove("hidden");
};

// --- SETTINGS LOGIC ---
saveKey.onclick = () => {
  const key = apiKey.value.trim();
  if (!key) return;
  chrome.storage.local.set({ geminiKey: key }, () => {
    keyStatus.textContent = "API Key Saved ✅";
    setTimeout(() => keyStatus.textContent = "", 2000);
  });
};

saveProfile.onclick = () => {
  chrome.storage.local.set({
    userName: userName.value.trim(),
    userEmail: userEmail.value.trim(),
    userPhone: userPhone.value.trim(),
    userLinkedIn: userLinkedIn.value.trim(),
    userGithub: userGithub.value.trim()
  }, () => {
    profileStatus.textContent = "Profile Saved ✅";
    setTimeout(() => profileStatus.textContent = "", 2000);
  });
};

uploadResume.onclick = async () => {
  const file = resumeFile.files[0];
  if (!file) return;
  resumeStatus.textContent = "Processing PDF...";
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
        resumeStatus.textContent = "Resume Ready ✅";
      });
    }
  } catch (e) {
    console.error(e);
    resumeStatus.textContent = "Error reading PDF";
  }
};


// --- HELPER: BUILD SIGNATURE ---
function getSignature(d) {
  let sig = "\n\nBest regards,\n";
  sig += (d.userName || "Candidate") + "\n";
  
  // STRICT PHONE FORMATTING (+91)
  let phone = d.userPhone || "";
  if (phone) {
    // Remove existing +91 or 0 prefix to clean it, then add +91
    let cleanPhone = phone.replace(/^(\+91|0)/, "").trim();
    sig += "+91-" + cleanPhone + "\n";
  }

  // Add Email
  if (d.userEmail) sig += d.userEmail + "\n";

  // Add Links
  if (d.userLinkedIn) sig += "LinkedIn: " + d.userLinkedIn + "\n";
  if (d.userGithub) sig += "GitHub: " + d.userGithub;
  
  return sig;
}


// --- GENERATION LOGIC ---
async function generate(type, btn) {
  const originalText = btn.innerText;
  btn.innerText = "Writing...";
  btn.disabled = true;
  output.value = "Analyzing job title & extracting details...";
  
  const tone = toneSelect.value; 

  chrome.storage.local.get([
    "geminiKey", "resumeText", "postText", "recruiterEmail",
    "userName", "userEmail", "userPhone", "userLinkedIn", "userGithub"
  ], (d) => {
    if (!d.geminiKey) {
      output.value = "Error: Please Save API Key in Settings.";
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    const jobText = d.postText || "Software Engineer role.";
    const rEmail = d.recruiterEmail || recruiterEmail.value || "";
    
    // --- SMART PROMPT ---
    // We ask for a specific format: "TITLE: ... ||| BODY: ..."
    const prompt = `
    Role: You are ${d.userName || "a professional developer"}.
    Task: Write a ${type} and extract the Job Title.
    
    CONTEXT:
    - Recruiter Email: ${rEmail}
    - Job Description: ${jobText.substring(0, 3000)}
    - My Resume: ${d.resumeText ? d.resumeText.substring(0, 3000) : "N/A"}
    - Tone: ${tone}
    
    OUTPUT FORMAT (Strictly follow this):
    TITLE: [Extract the exact Job Title from the text here, e.g. "Golang Backend Developer"]
    |||
    [Write the email body here]

    BODY RULES:
    1. Start with "Dear [Name]," (Infer name from email or use Hiring Manager).
    2. Write 2-3 short, punchy paragraphs matching my skills to the job.
    3. Keep it under 150 words.
    4. Stop after last paragraph. Do NOT sign my name.
    `;

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_WITH_GEMINI",
        apiKey: d.geminiKey,
        prompt: prompt,
      },
      (response) => {
        btn.innerText = originalText;
        btn.disabled = false;

        if (response.success) {
           const fullText = response.text;
           
           // --- PARSE THE AI RESPONSE ---
           // We split by "|||" to get Title and Body separately
           const parts = fullText.split("|||");
           
           let extractedTitle = "Developer Role";
           let aiBody = fullText;

           if (parts.length > 1) {
             extractedTitle = parts[0].replace("TITLE:", "").trim();
             aiBody = parts[1].trim();
           }

           // SAVE THE TITLE FOR GMAIL BUTTON
           chrome.storage.local.set({ lastGeneratedTitle: extractedTitle });

           // DISPLAY BODY + SIGNATURE
           const signature = getSignature(d);
           output.value = `${aiBody}${signature}`;
           
        } else {
           output.value = "⚠️ Error:\n" + response.error;
        }
      }
    );
  });
}

genEmail.onclick = () => generate("Job Application Email", genEmail);
genCover.onclick = () => generate("Cover Letter", genCover);


// --- GMAIL ACTION ---
sendGmail.onclick = () => {
  const rEmail = recruiterEmail.value;
  const content = output.value;
  
  if (!rEmail || !content) {
    if(!content) alert("Please generate text first!");
    return;
  }
  
  chrome.storage.local.get(["userName", "lastGeneratedTitle"], (d) => {
    // 1. Get the Smart Title we extracted earlier
    const jobTitle = d.lastGeneratedTitle || "Developer Position";
    
    // 2. Format Subject: "Application for [Role] - [Name]"
    const subject = `Application for ${jobTitle} - ${d.userName || "Candidate"}`;
    
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(rEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
    
    chrome.tabs.create({ url: url });
  });
};

copyText.onclick = () => {
  if (!output.value) return;
  navigator.clipboard.writeText(output.value);
  copyText.innerText = "Copied! ✅";
  setTimeout(() => copyText.innerText = "📋 Copy to Clipboard", 2000);
};