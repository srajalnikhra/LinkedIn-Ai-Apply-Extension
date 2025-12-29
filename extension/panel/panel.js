import * as pdfjsLib from "../lib/pdf.mjs";
import { EMAIL_PROMPT, COVER_LETTER_PROMPT } from "./prompts.js"; 

// Initialize PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.mjs");

// --- DOM ELEMENTS ---
const elements = {
  applyView: document.getElementById("applyView"),
  settingsView: document.getElementById("settingsView"),
  profileView: document.getElementById("profileView"),
  recruiterEmail: document.getElementById("recruiterEmail"),
  emailOutput: document.getElementById("emailOutput"),
  coverOutput: document.getElementById("coverOutput"),
  apiKey: document.getElementById("apiKey"),
  resumeFile: document.getElementById("resumeFile"),
  resumeFileDisplay: document.getElementById("resumeFileDisplay"),
  resumeFileName: document.getElementById("resumeFileName"),
  openProfile: document.getElementById("openProfile"),
  openSettings: document.getElementById("openSettings"),
  backBtn: document.getElementById("backBtn"),
  backBtnProfile: document.getElementById("backBtnProfile"),
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
  profileStatus: document.getElementById("profileStatus"),
  modelSelector: document.getElementById("modelSelector"),
  modelStatus: document.getElementById("modelStatus"),
  gmailAccountSelector: document.getElementById("gmailAccountSelector"),
  saveGmailAccount: document.getElementById("saveGmailAccount"),
  gmailAccountStatus: document.getElementById("gmailAccountStatus")
};

// --- DATE FORMAT MIGRATION (one-time) ---
chrome.storage.local.get(null, (data) => {
  const convertDateFormat = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      if (first <= 12 && second > 12) {
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
      }
      if (first > 12) {
        return dateStr;
      }
      if (first <= 12 && second <= 12 && second >= 1) {
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
      }
    }
    return dateStr;
  };

  const updates = {};
  let needsUpdate = false;

  if (data.keyUpdated && data.keyUpdated.includes('/')) {
    const converted = convertDateFormat(data.keyUpdated);
    if (converted !== data.keyUpdated) {
      updates.keyUpdated = converted;
      needsUpdate = true;
    }
  }
  if (data.modelUpdated && data.modelUpdated.includes('/')) {
    const converted = convertDateFormat(data.modelUpdated);
    if (converted !== data.modelUpdated) {
      updates.modelUpdated = converted;
      needsUpdate = true;
    }
  }
  if (data.profileUpdated && data.profileUpdated.includes('/')) {
    const converted = convertDateFormat(data.profileUpdated);
    if (converted !== data.profileUpdated) {
      updates.profileUpdated = converted;
      needsUpdate = true;
    }
  }
  if (data.resumeDate && data.resumeDate.includes('/')) {
    const converted = convertDateFormat(data.resumeDate);
    if (converted !== data.resumeDate) {
      updates.resumeDate = converted;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    chrome.storage.local.set(updates);
  }
});

// --- INITIAL LOAD ---
chrome.storage.local.get(null, (d) => {
  if (d.recruiterEmail) elements.recruiterEmail.value = d.recruiterEmail;
  if (d.geminiKey) elements.apiKey.value = d.geminiKey;
  if (d.userName) elements.userName.value = d.userName;
  if (d.userEmail) elements.userEmail.value = d.userEmail;
  if (d.userPhone) elements.userPhone.value = d.userPhone;
  if (d.userLinkedIn) elements.userLinkedIn.value = d.userLinkedIn;
  if (d.userGithub) elements.userGithub.value = d.userGithub;
  
  if (d.resumeFilename) {
    elements.resumeFileName.textContent = d.resumeFilename;
    if (d.resumeDate) {
      elements.resumeStatus.textContent = `${d.resumeFilename} - Uploaded: ${d.resumeDate}`;
    }
  } else if (d.resumeDate) {
    elements.resumeStatus.textContent = `Last uploaded: ${d.resumeDate}`;
  }
  
  if (d.selectedModel) {
    elements.modelSelector.value = d.selectedModel;
  } else {
    elements.modelSelector.value = "default";
  }
  
  if (d.selectedGmailAccount !== undefined) {
    elements.gmailAccountSelector.value = d.selectedGmailAccount;
  } else {
    elements.gmailAccountSelector.value = "0";
  }
  
  if (d.keyUpdated) elements.keyStatus.textContent = `Last updated: ${d.keyUpdated}`;
  if (d.modelUpdated) elements.modelStatus.textContent = `Last updated: ${d.modelUpdated}`;
  if (d.profileUpdated) elements.profileStatus.textContent = `Last updated: ${d.profileUpdated}`;
  if (d.gmailAccountUpdated) elements.gmailAccountStatus.textContent = `Last updated: ${d.gmailAccountUpdated}`;
  
  if (d.postText && d.geminiKey && d.resumeText) {
    autoGenerateContent();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.postText) {
    chrome.storage.local.get(['recruiterEmail', 'geminiKey', 'resumeText'], (d) => {
      if (d.recruiterEmail) elements.recruiterEmail.value = d.recruiterEmail;
      
      elements.emailOutput.value = "";
      elements.coverOutput.value = "";
      
      if (d.geminiKey && d.resumeText) {
        autoGenerateContent();
      }
    });
  }
});

// --- NAVIGATION ---
elements.openProfile.onclick = () => { 
  elements.applyView.classList.add("hidden"); 
  elements.settingsView.classList.add("hidden");
  elements.profileView.classList.remove("hidden"); 
};

elements.openSettings.onclick = () => { 
  elements.applyView.classList.add("hidden"); 
  elements.profileView.classList.add("hidden");
  elements.settingsView.classList.remove("hidden"); 
};

elements.backBtn.onclick = () => { 
  elements.settingsView.classList.add("hidden"); 
  elements.profileView.classList.add("hidden");
  elements.applyView.classList.remove("hidden"); 
};

elements.backBtnProfile.onclick = () => { 
  elements.settingsView.classList.add("hidden"); 
  elements.profileView.classList.add("hidden");
  elements.applyView.classList.remove("hidden"); 
};

// --- CUSTOM FILE INPUT HANDLER ---
elements.resumeFileDisplay.onclick = () => {
  elements.resumeFile.click();
};

elements.resumeFile.onchange = () => {
  const file = elements.resumeFile.files[0];
  if (file) {
    elements.resumeFileName.textContent = file.name;
  }
};

// --- SETTINGS LOGIC ---
elements.saveKey.onclick = () => {
  const key = elements.apiKey.value.trim();
  if (!key) return;
  
  elements.keyStatus.textContent = 'Updating...';
  
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  chrome.storage.local.set({ geminiKey: key, keyUpdated: dateStr }, () => {
    elements.keyStatus.textContent = `Last updated: ${dateStr}`;
  });
};

elements.modelSelector.onchange = () => {
  const model = elements.modelSelector.value;
  
  elements.modelStatus.textContent = 'Updating...';
  
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  chrome.storage.local.set({ selectedModel: model, modelUpdated: dateStr }, () => {
    elements.modelStatus.textContent = `Last updated: ${dateStr}`;
  });
};

elements.saveGmailAccount.onclick = () => {
  const account = elements.gmailAccountSelector.value;
  
  elements.gmailAccountStatus.textContent = 'Updating...';
  
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  chrome.storage.local.set({ selectedGmailAccount: account, gmailAccountUpdated: dateStr }, () => {
    elements.gmailAccountStatus.textContent = `Last updated: ${dateStr}`;
  });
};

elements.saveProfile.onclick = () => {
  elements.profileStatus.textContent = 'Updating...';
  
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  chrome.storage.local.set({
    userName: elements.userName.value.trim(),
    userEmail: elements.userEmail.value.trim(),
    userPhone: elements.userPhone.value.trim(),
    userLinkedIn: elements.userLinkedIn.value.trim(),
    userGithub: elements.userGithub.value.trim(),
    profileUpdated: dateStr
  }, () => {
    elements.profileStatus.textContent = `Last updated: ${dateStr}`;
  });
};

// --- RESUME UPLOAD ---
elements.uploadResume.onclick = async () => {
  const file = elements.resumeFile.files[0];
  if (!file) return;
  
  const filename = file.name;
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
        const now = new Date();
        const uploadDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        chrome.storage.local.set({ 
          resumeText: text, 
          resumeBase64: base64String, 
          resumeDate: uploadDate,
          resumeFilename: filename
        }, () => { 
          elements.resumeStatus.textContent = `${filename} - Uploaded: ${uploadDate}`;
          elements.resumeFileName.textContent = filename;
        });
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
async function generate(type, btn, targetInput, isAutoGenerate = false) {
  const originalText = btn.innerText;
  if (!isAutoGenerate) {
    btn.innerText = "Thinking...";
    btn.disabled = true;
  }
  
  if (type === "Job Application Email") {
    targetInput.value = "Reading Resume & writing Email...";
  } else {
    targetInput.value = "Reading Resume & writing Cover Letter...";
  }
  
  chrome.storage.local.get(null, (d) => {
    if (!d.geminiKey) {
      targetInput.value = "Error: Please Save API Key in Settings.";
      if (!isAutoGenerate) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
      return;
    }

    const jobText = d.postText || "Job description not found.";
    const rEmail = d.recruiterEmail || elements.recruiterEmail.value || "Hiring Manager";
    const myResume = d.resumeText ? d.resumeText.substring(0, 4000) : "N/A";
    const now = new Date();
    const todayDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let formattedPhone = "";
    if (d.userPhone) {
      const cleanPhone = d.userPhone.replace(/^(\+91|91|0)/, "").trim().replace(/\s/g, '');
      if (cleanPhone.length === 10) {
        formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
      } else {
        formattedPhone = `+91 ${cleanPhone}`;
      }
    }

    let prompt = (type === "Job Application Email" ? EMAIL_PROMPT : COVER_LETTER_PROMPT)
        .replace("{{recruiterEmail}}", rEmail)
        .replace("{{jobDescription}}", jobText.substring(0, 2000))
        .replace("{{myResume}}", myResume)
        .replace("{{userName}}", d.userName)
        .replace("{{userEmail}}", d.userEmail)
        .replace("{{userPhone}}", formattedPhone)
        .replace("{{userLinkedIn}}", d.userLinkedIn)
        .replace("{{userGithub}}", d.userGithub)
        .replace("{{todayDate}}", todayDate);

    let modelToUse;
    const selectedModel = d.selectedModel || "default";
    
    if (selectedModel === "default") {
      if (type === "Job Application Email") {
        modelToUse = "gemini-3-flash-preview";
      } else {
        modelToUse = "gemini-2.5-flash";
      }
    } else {
      modelToUse = selectedModel;
    }

    chrome.runtime.sendMessage(
      { type: "GENERATE_WITH_GEMINI", apiKey: d.geminiKey, prompt: prompt, model: modelToUse },
      (response) => {
        if (!isAutoGenerate) {
          btn.innerText = originalText;
          btn.disabled = false;
        }
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
               if (d.userEmail) sig += `\nEmail: ${d.userEmail}`;
               if (d.userPhone) {
                 const cleanPhone = d.userPhone.replace(/^(\+91|91|0)/, "").trim().replace(/\s/g, '');
                 if (cleanPhone.length === 10) {
                   sig += `\nPhone: +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
                 } else {
                   sig += `\nPhone: +91 ${cleanPhone}`;
                 }
               }
               if (d.userLinkedIn) sig += `\nLinkedIn: ${d.userLinkedIn}`;
               if (d.userGithub) sig += `\nGitHub: ${d.userGithub}`;
               
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

function autoGenerateContent() {
  elements.emailOutput.value = "Reading Resume & writing Email...";
  elements.coverOutput.value = "Reading Resume & writing Cover Letter...";
  
  generate("Job Application Email", elements.genEmail, elements.emailOutput, true);
  generate("Cover Letter", elements.genCover, elements.coverOutput, true);
}

elements.genEmail.onclick = () => generate("Job Application Email", elements.genEmail, elements.emailOutput);
elements.genCover.onclick = () => generate("Cover Letter", elements.genCover, elements.coverOutput);

elements.downloadPdf.onclick = () => {
    const text = elements.coverOutput.value;
    if(!text) { alert("Generate a cover letter first!"); return; }
    
    const rEmail = elements.recruiterEmail.value;
    let companyName = "Company";
    if (rEmail && rEmail.includes("@")) {
      const domain = rEmail.split("@")[1];
      if (domain) {
        companyName = domain.split(".")[0];
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      }
    }
    
    const doc = createStyledPDF(text);
    doc.save(`Cover_Letter_${companyName}.pdf`);
};

elements.copyCover.onclick = () => {
    if(!elements.coverOutput.value) return;
    navigator.clipboard.writeText(elements.coverOutput.value);
    elements.copyCover.innerText = "Copied!";
    setTimeout(() => elements.copyCover.innerText = "Copy Text", 2000);
}

elements.directSend.onclick = async () => {
  console.log("[Panel] 'Open Gmail' Button Clicked");

  const rEmail = elements.recruiterEmail.value;
  const emailBody = elements.emailOutput.value;
  const coverText = elements.coverOutput.value;

  if (!rEmail || !emailBody) {
    alert("Please generate the Email Body first.");
    return;
  }

  elements.directSend.disabled = true;
  elements.directSend.innerText = "Preparing...";
  elements.sendStatus.innerText = "Generating Cover Letter PDF...";

  chrome.storage.local.get(["resumeBase64", "lastGeneratedTitle", "userName", "selectedGmailAccount"], (d) => {
    if (!d.resumeBase64) {
      alert("Please upload your resume in Settings first!");
      elements.directSend.disabled = false;
      elements.directSend.innerText = "Send via Gmail";
      elements.sendStatus.innerText = "";
      return;
    }

    let companyName = "Company";
    if (rEmail && rEmail.includes("@")) {
      const domain = rEmail.split("@")[1];
      if (domain) {
        companyName = domain.split(".")[0];
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      }
    }

    let coverDoc = null;
    if (coverText && coverText.length > 50) {
      coverDoc = createStyledPDF(coverText);
      coverDoc.save(`Cover_Letter_${companyName}.pdf`);
    }

    const accountIndex = d.selectedGmailAccount || "0";

    const subject = `Application for ${d.lastGeneratedTitle || "Role"} - ${d.userName || "Candidate"}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&authuser=${accountIndex}&to=${encodeURIComponent(rEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    const accountLabels = [
      "Primary Gmail (authuser=0)", "Gmail Account 2 (authuser=1)", "Gmail Account 3 (authuser=2)", 
      "Gmail Account 4 (authuser=3)", "Gmail Account 5 (authuser=4)", "Gmail Account 6 (authuser=5)",
      "Gmail Account 7 (authuser=6)", "Gmail Account 8 (authuser=7)", "Gmail Account 9 (authuser=8)", "Gmail Account 10 (authuser=9)"
    ];
    const accountLabel = accountLabels[parseInt(accountIndex)] || "Primary Gmail (authuser=0)";

    elements.sendStatus.innerText = "✅ Cover Letter Downloaded! Opening Gmail...";
    
    setTimeout(() => {
      window.open(gmailUrl, '_blank');
      
      elements.directSend.innerText = "Send via Gmail";
      elements.directSend.disabled = false;
      elements.sendStatus.innerHTML = `
        <div style="color: #10b981; font-weight: 600;">✅ Gmail opened in ${accountLabel}!</div>
        <div style="color: #7dd3fc; font-size: 11px; margin-top: 5px;">
          1. Cover_Letter_${companyName}.pdf downloaded to your Downloads folder<br>
          2. Attach Resume + Cover Letter PDFs to the email<br>
          3. Verify you're in the correct Gmail account<br>
          4. Click Send!
        </div>
      `;
      
      setTimeout(() => {
        elements.sendStatus.textContent = "";
      }, 10000);
    }, 1000);
  });
};