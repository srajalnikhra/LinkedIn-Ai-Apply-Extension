# 🚀 LinkedIn-AI-Apply-Extension | Chrome Extension for Smarter Job Applications

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-blue)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-green)
![LinkedIn](https://img.shields.io/badge/Integration-LinkedIn-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**LinkedIn-AI-Apply-Extension** is a productivity-focused Chrome extension that helps job seekers apply faster on LinkedIn by generating human-written, recruiter-friendly emails and cover letters using AI — without losing context or personalization.

It detects recruiter emails directly from LinkedIn posts, understands the job description and your resume, and opens Gmail with everything pre-filled.

---

## 📌 Features

✅ Automatically detects recruiter emails inside LinkedIn job posts  
✅ Reads and understands the job description context  
✅ Analyzes your resume (PDF) in real time  
✅ Generates human-written, role-specific emails & cover letters  
✅ One-click **Apply (AI) 🚀** button on eligible posts  
✅ Opens Gmail compose with subject and content pre-filled  
✅ Supports multiple Gemini models with auto-selection  
✅ Supports multiple Gmail accounts (authuser based selection)  
✅ Clean, distraction-free UI built for daily use  

---

## ⚙️ Tech Stack

### Frontend:
- Vanilla JavaScript
- HTML, CSS (custom UI, no framework bloat)
- Chrome Extension APIs (Manifest V3)

### AI Integration:
- Google Gemini API
- Context-aware prompt engineering
- Multi-model support with fallback handling

### File Processing:
- PDF.js (resume parsing)
- jsPDF (cover letter PDF generation)

### Email Automation:
- Gmail Compose (pre-filled flow)
- Multi-account routing using authuser

### Storage & State:
- Chrome Storage API
- Persistent user preferences

---

## 📂 Project Structure

```
LinkedIn-AI-Apply-Extension/
│── extension/
│   ├── content/
│   │   └── content.js          # Injects Apply (AI) button on LinkedIn posts
│   │
│   ├── icons/
│   │   └── *.png               # Extension icons (16, 32, 48, 128)
│   │
│   ├── lib/
│   │   ├── pdf.js              # PDF parsing library
│   │   ├── pdf.worker.mjs
│   │   └── jspdf.umd.min.js    # PDF generation
│   │
│   ├── panel/
│   │   ├── panel.html          # Extension UI
│   │   ├── panel.js            # UI logic & interactions
│   │   └── prompts.js          # AI prompt definitions
│   │
│   ├── background.js           # Background service worker
│   └── manifest.json           # Extension configuration (MV3)
│
│── README.md
│── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- Google Chrome (latest)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- At least one Gmail account logged into your browser

---

## 🧩 Installation (Local / Developer Mode)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/srajalnikhra/LinkedIn-AI-Apply-Extension.git
cd LinkedIn-AI-Apply-Extension
```

### 2️⃣ Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

The extension will now appear in your Chrome toolbar.

---

## ⚡ Quick Start Guide (How to Use)

1. Add your profile details and upload your resume (PDF)
2. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and save it in Settings
3. Default AI model is auto-selected for best results (change if limits are reached)
4. Select the Gmail account by matching the authuser number shown in Gmail
5. Browse LinkedIn job posts — **Apply (AI) 🚀** appears when a recruiter email is found
6. Click **Apply (AI)** to generate the email and cover letter (edit or regenerate if needed)
7. Click **Send via Gmail**, attach files if required, and send

---

## 🧠 Why This Extension Exists

Most tools generate generic AI content.

This extension focuses on:

- **Context over templates**
- **Human-written tone** over robotic output
- **Speed without losing personalization**

It doesn't fake experience — it helps you communicate your real profile faster.

---

## 💡 Future Enhancements

🔹 One-click attachment auto-insert (resume + cover letter)  
🔹 Job tracking & application history  
🔹 Prompt customization per company  
🔹 Chrome Web Store release  
🔹 UI localization & accessibility improvements  

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](https://github.com/srajalnikhra/LinkedIn-AI-Apply-Extension/issues).

---

## 💬 Support

If you find this extension helpful, consider:

⭐ Starring the repository  
🐛 Reporting bugs via [Issues](https://github.com/srajalnikhra/LinkedIn-AI-Apply-Extension/issues)  
💡 Suggesting features  
📢 Sharing with other job seekers  

---

## 👨‍💻 Author

**Srajal Nikhra**

- GitHub: [@srajalnikhra](https://github.com/srajalnikhra)
- LinkedIn: [linkedin.com/in/srajalnikhra](https://linkedin.com/in/srajalnikhra)

---

**Built with ❤️ for job seekers who want to work smarter, not harder.**
