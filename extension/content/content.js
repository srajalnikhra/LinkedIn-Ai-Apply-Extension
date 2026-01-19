function injectButton(post) {
  // 1. Avoid duplicates
  if (post.querySelector(".ai-apply-btn")) return;

  // 2. Extract Text
  const text = post.innerText || "";

  // 3. STRICT Email Regex
  // Matches standard emails (e.g., name@company.com)
  const emailMatch = text.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
  );

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
    border-radius: 0 0 8px 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    z-index: 9999;
  `;

  btn.style.transition =
    "background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease, box-shadow 0.2s ease";

  btn.onmouseenter = () => {
    btn.style.backgroundColor = "#0059b3";
    btn.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
  };

  btn.onmouseleave = () => {
    btn.style.backgroundColor = "#0a66c2";
    btn.style.boxShadow = "none";
  };

  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Send data to background
    chrome.runtime.sendMessage({
      type: "SET_PANEL_DATA",
      payload: {
        email: emailMatch[0], // Send the found email
        postText: text,
      },
    });

    // Open Panel
    chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
  };

  // 6. Inject Button
  const actionContainer =
    post.querySelector(".feed-shared-update-v2__description-wrapper") ||
    post.querySelector(".feed-shared-update-v2__actions") ||
    post;

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
