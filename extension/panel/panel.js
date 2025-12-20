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
const directSend = document.getElementById("directSend"); 
const sendStatus = document.getElementById("sendStatus");
const copyText = document.getElementById("copyText");
const keyStatus = document.getElementById("keyStatus");
const resumeStatus = document.getElementById("resumeStatus");

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
  "userName", "userEmail", "userPhone", "userLinkedIn", "userGithub", "resumeDate"
], (d) => {
  if (d.recruiterEmail) recruiterEmail.value = d.recruiterEmail;
  if (d.geminiKey) apiKey.value = d.geminiKey;
  if (d.userName) userName.value = d.userName;
  if (d.userEmail) userEmail.value = d.userEmail;
  if (d.userPhone) userPhone.value = d.userPhone;
  if (d.userLinkedIn) userLinkedIn.value = d.userLinkedIn;
  if (d.userGithub) userGithub.value = d.userGithub;
  
  if (d.resumeDate) resumeStatus.textContent = `Last uploaded: ${d.resumeDate} ✅`;
});

// --- NAVIGATION ---
openSettings.onclick = () => { applyView.classList.add("hidden"); settingsView.classList.remove("hidden"); };
backBtn.onclick = () => { settingsView.classList.add("hidden"); applyView.classList.remove("hidden"); };

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

// --- RESUME UPLOAD ---
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

      // Read as Base64 for Email Attachment
      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64String = evt.target.result.split(',')[1]; 
        
        chrome.storage.local.set({ 
          resumeText: text, 
          resumeBase64: base64String,
          resumeDate: new Date().toLocaleDateString()
        }, () => {
          resumeStatus.textContent = "Resume Saved (Ready to Send) ✅";
        });
      };
      reader.readAsDataURL(file);
    }
  } catch (e) {
    console.error(e);
    resumeStatus.textContent = "Error reading PDF";
  }
};

// --- GENERATION HELPERS ---
function getSignature(d) {
  let sig = "\n\nBest regards,\n";
  sig += (d.userName || "Candidate") + "\n";
  let phone = d.userPhone || "";
  if (phone) sig += phone + "\n";
  if (d.userEmail) sig += d.userEmail + "\n";
  if (d.userLinkedIn) sig += "LinkedIn: " + d.userLinkedIn + "\n";
  if (d.userGithub) sig += "GitHub: " + d.userGithub;
  return sig;
}

// --- GENERATION LOGIC ---
async function generate(type, btn) {
  const originalText = btn.innerText;
  btn.innerText = "Writing...";
  btn.disabled = true;
  output.value = "Analyzing job...";
  
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
    
    const prompt = `
    Role: You are ${d.userName || "a professional developer"}.
    Task: Write a ${type} and extract the Job Title.
    CONTEXT:
    - Recruiter Email: ${rEmail}
    - Job Description: ${jobText.substring(0, 3000)}
    - My Resume: ${d.resumeText ? d.resumeText.substring(0, 3000) : "N/A"}
    - Tone: ${tone}
    
    OUTPUT FORMAT:
    TITLE: [Extract Job Title]
    |||
    [Email Body]

    RULES:
    1. Start with "Dear [Name],"
    2. Write 2-3 paragraphs.
    3. Under 150 words.
    4. Stop after "Sincerely,".
    `;

    chrome.runtime.sendMessage(
      { type: "GENERATE_WITH_GEMINI", apiKey: d.geminiKey, prompt: prompt },
      (response) => {
        btn.innerText = originalText;
        btn.disabled = false;

        if (response.success) {
           const parts = response.text.split("|||");
           let extractedTitle = "Developer Role";
           let aiBody = response.text;

           if (parts.length > 1) {
             extractedTitle = parts[0].replace("TITLE:", "").trim();
             aiBody = parts[1].trim();
           }

           chrome.storage.local.set({ lastGeneratedTitle: extractedTitle });
           output.value = `${aiBody}${getSignature(d)}`;
        } else {
           output.value = "⚠️ Error:\n" + response.error;
        }
      }
    );
  });
}

genEmail.onclick = () => generate("Job Application Email", genEmail);
genCover.onclick = () => generate("Cover Letter", genCover);

// --- IRON MAN SENDING ---
directSend.onclick = async () => {
  const rEmail = recruiterEmail.value;
  const content = output.value;

  if (!rEmail || !content) {
    alert("Missing email or generated text.");
    return;
  }

  directSend.disabled = true;
  directSend.innerText = "⏳ Preparing...";
  sendStatus.innerText = "Building package...";

  chrome.storage.local.get(["resumeBase64", "lastGeneratedTitle", "userName"], async (d) => {
    if (!d.resumeBase64) {
      alert("Please upload your resume in Settings first!");
      directSend.innerText = "🚀 Send Directly";
      directSend.disabled = false;
      return;
    }

    // 1. GENERATE COVER PDF IN MEMORY
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180); 
    doc.text(splitText, 10, 10);
    const coverBase64 = doc.output('datauristring').split(',')[1];

    // 2. CONSTRUCT RAW MIME
    const boundary = "foo_bar_baz";
    const subject = `Application for ${d.lastGeneratedTitle || "Role"} - ${d.userName || "Candidate"}`;
    
    let message = [
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      `MIME-Version: 1.0`,
      `to: ${rEmail}`,
      `subject: ${subject}`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      content,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="Resume.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="Resume.pdf"`,
      ``,
      d.resumeBase64,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="CoverLetter.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="CoverLetter.pdf"`,
      ``,
      coverBase64,
      ``,
      `--${boundary}--`
    ].join("\n");

    // 3. ENCODE
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. SEND MESSAGE TO BACKGROUND
    sendStatus.innerText = "Authorizing & Sending...";
    
    chrome.runtime.sendMessage(
      { type: "SEND_GMAIL_API", rawMessage: encodedMessage },
      (response) => {
        if (response && response.success) {
          sendStatus.innerText = "Sent Successfully! 🚀";
          directSend.innerText = "Sent! ✅";
          setTimeout(() => {
            directSend.innerText = "🚀 Send Directly";
            directSend.disabled = false;
            sendStatus.innerText = "";
          }, 3000);
        } else {
          sendStatus.innerText = "Error: " + (response?.error || "Failed");
          directSend.innerText = "Retry Send";
          directSend.disabled = false;
        }
      }
    );
  });
};

copyText.onclick = () => {
  if (!output.value) return;
  navigator.clipboard.writeText(output.value);
  copyText.innerText = "Copied! ✅";
  setTimeout(() => copyText.innerText = "📋 Copy to Clipboard", 2000);
};