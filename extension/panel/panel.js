import * as pdfjsLib from "../lib/pdf.mjs";
import { EMAIL_PROMPT, COVER_LETTER_PROMPT } from "./prompts.js"; 

// Initialize PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.mjs");

// --- DOM ELEMENTS ---
const elements = {
  applyView: document.getElementById("applyView"),
  settingsView: document.getElementById("settingsView"),
  recruiterEmail: document.getElementById("recruiterEmail"),
  emailOutput: document.getElementById("emailOutput"),
  coverOutput: document.getElementById("coverOutput"),
  apiKey: document.getElementById("apiKey"),
  resumeFile: document.getElementById("resumeFile"),
  openSettings: document.getElementById("openSettings"),
  backBtn: document.getElementById("backBtn"),
  saveKey: document.getElementById("saveKey"),
  uploadResume: document.getElementById("uploadResume"),
  genEmail: document.getElementById("genEmail"),
  genCover: document.getElementById("genCover"),
  directSend: document.getElementById("directSend"), 
  sendStatus: document.getElementById("sendStatus"),
  downloadPdf: document.getElementById("downloadPdf"),
  copyCover: document.getElementById("copyCover"),
  keyStatus: document.getElementById("keyStatus"),
  resumeStatus: document.getElementById("resumeStatus"),
  userName: document.getElementById("userName"),
  userEmail: document.getElementById("userEmail"), 
  userPhone: document.getElementById("userPhone"),
  userLinkedIn: document.getElementById("userLinkedIn"),
  userGithub: document.getElementById("userGithub"),
  saveProfile: document.getElementById("saveProfile"),
  profileStatus: document.getElementById("profileStatus")
};

// --- INITIAL LOAD ---
chrome.storage.local.get(null, (d) => {
  if (d.recruiterEmail) elements.recruiterEmail.value = d.recruiterEmail;
  if (d.geminiKey) elements.apiKey.value = d.geminiKey;
  if (d.userName) elements.userName.value = d.userName;
  if (d.userEmail) elements.userEmail.value = d.userEmail;
  if (d.userPhone) elements.userPhone.value = d.userPhone;
  if (d.userLinkedIn) elements.userLinkedIn.value = d.userLinkedIn;
  if (d.userGithub) elements.userGithub.value = d.userGithub;
  if (d.resumeDate) elements.resumeStatus.textContent = `Last uploaded: ${d.resumeDate} ✅`;
});

// --- NAVIGATION ---
elements.openSettings.onclick = () => { elements.applyView.classList.add("hidden"); elements.settingsView.classList.remove("hidden"); };
elements.backBtn.onclick = () => { elements.settingsView.classList.add("hidden"); elements.applyView.classList.remove("hidden"); };

// --- SETTINGS LOGIC ---
elements.saveKey.onclick = () => {
  const key = elements.apiKey.value.trim();
  if (!key) return;
  chrome.storage.local.set({ geminiKey: key }, () => {
    elements.keyStatus.textContent = "API Key Saved ✅";
    setTimeout(() => elements.keyStatus.textContent = "", 2000);
  });
};

elements.saveProfile.onclick = () => {
  chrome.storage.local.set({
    userName: elements.userName.value.trim(),
    userEmail: elements.userEmail.value.trim(),
    userPhone: elements.userPhone.value.trim(),
    userLinkedIn: elements.userLinkedIn.value.trim(),
    userGithub: elements.userGithub.value.trim()
  }, () => {
    elements.profileStatus.textContent = "Profile Saved ✅";
    setTimeout(() => elements.profileStatus.textContent = "", 2000);
  });
};

// --- RESUME UPLOAD ---
elements.uploadResume.onclick = async () => {
  const file = elements.resumeFile.files[0];
  if (!file) return;
  elements.resumeStatus.textContent = "Processing PDF...";
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
      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64String = evt.target.result.split(',')[1]; 
        chrome.storage.local.set({ 
          resumeText: text, resumeBase64: base64String, resumeDate: new Date().toLocaleDateString()
        }, () => { elements.resumeStatus.textContent = "Resume Saved (Ready to Send) ✅"; });
      };
      reader.readAsDataURL(file);
    }
  } catch (e) {
    console.error(e);
    elements.resumeStatus.textContent = "Error reading PDF";
  }
};

// --- PDF GENERATOR HELPER ---
function createStyledPDF(text) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 20;        
    const fontSize = 11;      
    const lineHeightFactor = 1.2; 
    const pointsToMm = 0.3528; 
    const singleLineHeight = fontSize * pointsToMm * lineHeightFactor;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(20, 20, 20); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);
    let y = margin + 5;
    const lines = text.split(/\r?\n/);
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) { y += 5; return; }
        const wrappedLines = doc.splitTextToSize(cleanLine, maxLineWidth);
        const blockHeight = wrappedLines.length * singleLineHeight;
        if (y + blockHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage(); y = margin;
        }
        doc.text(wrappedLines, margin, y);
        y += blockHeight; 
    });
    return doc;
}

// --- GENERATE CONTENT ---
async function generate(type, btn, targetInput) {
  const originalText = btn.innerText;
  btn.innerText = "Thinking...";
  btn.disabled = true;
  targetInput.value = "Reading resume & writing content...";
  
  chrome.storage.local.get(null, (d) => {
    if (!d.geminiKey) {
      targetInput.value = "Error: Please Save API Key in Settings.";
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    const jobText = d.postText || "Job description not found.";
    const rEmail = d.recruiterEmail || elements.recruiterEmail.value || "Hiring Manager";
    const myResume = d.resumeText ? d.resumeText.substring(0, 4000) : "N/A";
    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let prompt = (type === "Job Application Email" ? EMAIL_PROMPT : COVER_LETTER_PROMPT)
        .replace("{{recruiterEmail}}", rEmail)
        .replace("{{jobDescription}}", jobText.substring(0, 2000))
        .replace("{{myResume}}", myResume)
        .replace("{{userName}}", d.userName)
        .replace("{{userEmail}}", d.userEmail)
        .replace("{{userPhone}}", "+91-" + (d.userPhone || "").replace(/^(\+91|91|0)/, "").trim())
        .replace("{{userLinkedIn}}", d.userLinkedIn)
        .replace("{{userGithub}}", d.userGithub)
        .replace("{{todayDate}}", todayDate);

    chrome.runtime.sendMessage(
      { type: "GENERATE_WITH_GEMINI", apiKey: d.geminiKey, prompt: prompt },
      (response) => {
        btn.innerText = originalText;
        btn.disabled = false;
        if (response.success) {
           const fullText = response.text;
           if (type === "Job Application Email") {
               const parts = fullText.split("|||");
               let extractedTitle = "Developer Role";
               let aiBody = fullText;
               if (parts.length > 1) {
                 extractedTitle = parts[0].replace("TITLE:", "").trim();
                 aiBody = parts[1].trim();
               }
               chrome.storage.local.set({ lastGeneratedTitle: extractedTitle });
               
               let sig = `\n\nBest regards,\n${d.userName || "Candidate"}\n`;
               if (d.userPhone) sig += `${d.userPhone}\n`;
               if (d.userLinkedIn) sig += `LinkedIn: ${d.userLinkedIn}`;
               
               targetInput.value = aiBody + sig;
           } else {
               targetInput.value = fullText;
           }
        } else {
           targetInput.value = "⚠️ Error:\n" + response.error;
        }
      }
    );
  });
}

elements.genEmail.onclick = () => generate("Job Application Email", elements.genEmail, elements.emailOutput);
elements.genCover.onclick = () => generate("Cover Letter", elements.genCover, elements.coverOutput);

elements.downloadPdf.onclick = () => {
    const text = elements.coverOutput.value;
    if(!text) { alert("Generate a cover letter first!"); return; }
    const doc = createStyledPDF(text);
    doc.save("Cover_Letter.pdf");
};

elements.copyCover.onclick = () => {
    if(!elements.coverOutput.value) return;
    navigator.clipboard.writeText(elements.coverOutput.value);
    elements.copyCover.innerText = "Copied!";
    setTimeout(() => elements.copyCover.innerText = "📋 Copy Text", 2000);
}

// --- SEND LOGIC (DEBUGGED) ---
elements.directSend.onclick = async () => {
  console.log("[Panel] 'Send All' Button Clicked"); 

  const rEmail = elements.recruiterEmail.value;
  const emailBody = elements.emailOutput.value;
  const coverText = elements.coverOutput.value; 

  if (!rEmail || !emailBody) {
    alert("Please generate the Email Body first.");
    return;
  }

  elements.directSend.disabled = true;
  elements.directSend.innerText = "⏳ Checking Login...";
  elements.sendStatus.innerText = "Checking Login...";

  console.log("[Panel] Calling chrome.identity.getAuthToken...");

  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    console.log("[Panel] getAuthToken callback triggered. Token:", token ? "Received" : "Null");

    if (chrome.runtime.lastError) {
      console.error("[Panel ERROR] Auth failed:", chrome.runtime.lastError);
      alert("Login Failed: " + chrome.runtime.lastError.message);
      elements.directSend.innerText = "🚀 Send All";
      elements.directSend.disabled = false;
      elements.sendStatus.innerText = "Login Failed.";
      return;
    }

    if (!token) {
        console.error("[Panel ERROR] No token received.");
        elements.sendStatus.innerText = "Auth Error: No Token";
        return;
    }

    elements.sendStatus.innerText = "Packaging attachments...";
    
    setTimeout(() => {
        chrome.storage.local.get(["resumeBase64", "lastGeneratedTitle", "userName"], (d) => {
          if (!d.resumeBase64) {
            alert("Please upload your resume in Settings first!");
            elements.directSend.disabled = false;
            return;
          }

          let coverBase64 = null;
          if (coverText && coverText.length > 50) {
              const doc = createStyledPDF(coverText); 
              coverBase64 = doc.output('datauristring').split(',')[1];
          }

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
            emailBody, 
            ``,
            `--${boundary}`,
            `Content-Type: application/pdf; name="Resume.pdf"`,
            `Content-Transfer-Encoding: base64`,
            `Content-Disposition: attachment; filename="Resume.pdf"`,
            ``,
            d.resumeBase64,
            ``
          ];

          if (coverBase64) {
              message.push(`--${boundary}`);
              message.push(`Content-Type: application/pdf; name="Cover_Letter.pdf"`);
              message.push(`Content-Transfer-Encoding: base64`);
              message.push(`Content-Disposition: attachment; filename="Cover_Letter.pdf"`);
              message.push(``);
              message.push(coverBase64);
              message.push(``);
          }

          message.push(`--${boundary}--`);

          const rawData = message.join("\n");
          const encodedMessage = btoa(unescape(encodeURIComponent(rawData)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          elements.sendStatus.innerText = "Sending...";
          console.log("[Panel] Sending message to Background...");
          
          chrome.runtime.sendMessage(
            { type: "SEND_GMAIL_API", rawMessage: encodedMessage },
            (response) => {
              console.log("[Panel] Background Response:", response);
              if (response && response.success) {
                elements.sendStatus.innerText = "Sent Successfully! 🚀";
                elements.directSend.innerText = "Sent! ✅";
                setTimeout(() => {
                  elements.directSend.innerText = "🚀 Send All";
                  elements.directSend.disabled = false;
                  elements.sendStatus.innerText = "";
                }, 3000);
              } else {
                elements.sendStatus.innerText = "Error: " + (response?.error || "Failed");
                elements.directSend.innerText = "Retry Send";
                elements.directSend.disabled = false;
              }
            }
          );
        });
    }, 100);
  });
};