function injectButton(post) {
  // 1. Avoid duplicates
  if (post.querySelector(".ai-apply-btn")) return;

  // 2. Extract Text
  const text = post.innerText || "";

  // 3. STRICT Email Regex
  // Matches standard emails (e.g., name@company.com)
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);

  // 4. IF NO EMAIL, STOP IMMEDIATELY
  if (!emailMatch) {
    return; 
  }

  // Debugging: Check console to see what email triggered the button
  console.log("LinkedIn AI: Found email:", emailMatch[0]);

  // 5. Create Button
  const btn = document.createElement("button");
  btn.className = "ai-apply-btn";
  btn.innerText = "Apply (AI) 🚀";
  btn.style.cssText = `
    width: 100%;
    margin-top: 8px;
    padding: 8px 16px;
    background-color: #0a66c2;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    z-index: 9999;
  `;

  btn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Send data to background
    chrome.runtime.sendMessage({
      type: "SET_PANEL_DATA",
      payload: {
        email: emailMatch[0], // Send the found email
        postText: text
      }
    });

    // Open Panel
    chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
  };

  // 6. Inject Button
  const actionContainer = post.querySelector(".feed-shared-update-v2__description-wrapper") 
                       || post.querySelector(".feed-shared-update-v2__actions") 
                       || post;
  
  actionContainer.appendChild(btn);
}

function scan() {
  // Select all post containers
  const posts = document.querySelectorAll("div.feed-shared-update-v2");
  posts.forEach(injectButton);
}

// Start scanning
scan();
setInterval(scan, 2000); // Simple interval to catch new scroll items