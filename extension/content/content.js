// content/content.js

function injectApplyButton(post, email, postText) {
  if (post.querySelector(".ai-apply-btn")) return;

  const btn = document.createElement("button");
  btn.innerText = "Apply (AI) · 1 email(s)";
  btn.className = "ai-apply-btn";
  btn.style.cssText = `
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  `;

  btn.onclick = async () => {
    // 1️⃣ Get active tab safely
    chrome.runtime.sendMessage({ type: "GET_TAB" }, (tabs) => {
      if (!tabs || !tabs[0]) return;

      const tabId = tabs[0].id;

      // 2️⃣ Store data for panel
      chrome.storage.local.set({
        applyData: {
          email,
          postText,
        },
      });

      // 3️⃣ Force open panel every click
      chrome.runtime.sendMessage({
        type: "OPEN_PANEL",
        tabId,
      });
    });
  };

  post.appendChild(btn);
}

function scanPosts() {
  const posts = document.querySelectorAll("div.feed-shared-update-v2");

  posts.forEach((post) => {
    const text = post.innerText || "";
    const emailMatch = text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    if (!emailMatch) return;

    injectApplyButton(post, emailMatch[0], text);
  });
}

setInterval(scanPosts, 3000);
